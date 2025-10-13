import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const EXTRACTION_PROMPT = `
You are a medical data extraction assistant. Analyze this body composition report image and extract ALL visible measurements.

IMPORTANT RULES:
1. Return ONLY valid JSON array
2. Use metric keys from this list: weight, height, bmi, body_fat_percent, skeletal_muscle_mass, visceral_fat_level, body_water_percent, protein, mineral, basal_metabolic_rate
3. Convert all numbers to use dots (77,1 → 77.1)
4. Include confidence score (0.0-1.0) for each field
5. If a field is unclear, set confidence < 0.8
6. Preserve original text in raw_text field
7. Handle multi-language labels (English, Polish, Spanish, etc.)

Expected format:
[
  {
    "metric": "weight",
    "value": 77.1,
    "unit": "kg",
    "raw_text": "Waga: 77,1 kg",
    "confidence": 0.96
  }
]

Extract measurements now:
`;

interface ExtractionRequest {
  imageUrl: string;
}

interface ExtractedMeasurement {
  metric: string;
  value: number;
  unit: string;
  raw_text?: string;
  confidence?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ExtractionRequest = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Call OpenAI GPT-4o Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: EXTRACTION_PROMPT
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for more consistent extraction
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedData: any;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Extract measurements array (handle different response formats)
    let measurements: ExtractedMeasurement[] = [];
    if (Array.isArray(parsedData)) {
      measurements = parsedData;
    } else if (parsedData.measurements && Array.isArray(parsedData.measurements)) {
      measurements = parsedData.measurements;
    } else {
      throw new Error('Unexpected response format from AI');
    }

    // Validate and normalize measurements
    const validatedMeasurements = measurements
      .filter(m => m.metric && typeof m.value === 'number' && m.unit)
      .map(m => ({
        metric: m.metric.toLowerCase().trim(),
        value: parseFloat(m.value.toString()),
        unit: m.unit.trim(),
        raw_text: m.raw_text || '',
        confidence: m.confidence || 0.9
      }));

    if (validatedMeasurements.length === 0) {
      return NextResponse.json(
        { error: 'No valid measurements found in image' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      measurements: validatedMeasurements,
      count: validatedMeasurements.length
    });

  } catch (error: any) {
    // Detailed error logging
    console.error('=== MEASUREMENT EXTRACTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    console.error('====================================');
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'AI service quota exceeded. Please add credits to your OpenAI account.',
          code: 'insufficient_quota'
        },
        { status: 503 }
      );
    }

    if (error.code === 'model_not_found') {
      return NextResponse.json(
        { 
          error: 'GPT-4o model not available. Your API key may not have access to vision models.',
          code: 'model_not_found'
        },
        { status: 403 }
      );
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key. Please check your .env.local file.',
          code: 'invalid_api_key'
        },
        { status: 401 }
      );
    }

    if (error.status === 401) {
      return NextResponse.json(
        { 
          error: 'OpenAI authentication failed. Check your API key.',
          code: 'auth_failed',
          details: error.message
        },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          code: 'rate_limit'
        },
        { status: 429 }
      );
    }

    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error.message || 'Failed to extract measurements',
        code: error.code || 'unknown_error',
        type: error.type || 'unknown',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
