import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const EXTRACTION_PROMPT = `
You are a medical data extraction assistant. Analyze this InBody/body composition report image and extract ALL visible measurements including segmental data.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON array (no other text)
2. Extract EVERY measurement you can see - basic metrics, segmental data, water balance, scores, etc.
3. ALL metric keys MUST be in ENGLISH from this comprehensive list:
   - Basic: weight, height, bmi, body_fat_percent, body_fat_mass, skeletal_muscle_mass, lean_body_mass, fat_free_mass
   - Water: total_body_water, intracellular_water, extracellular_water, ecw_ratio
   - Nutrition: protein, mineral, body_cell_mass
   - Fat: visceral_fat_level, waist_hip_ratio, obesity_grade
   - Energy: basal_metabolic_rate, target_caloric_intake, ideal_body_weight
   - Control: fat_control, muscle_control, weight_control
   - Scores: fitness_score, inbody_score
   - Segmental Lean Mass: segmental_lean_mass_right_arm, segmental_lean_mass_left_arm, segmental_lean_mass_trunk, segmental_lean_mass_right_leg, segmental_lean_mass_left_leg
   - Segmental Fat Mass: segmental_fat_mass_right_arm, segmental_fat_mass_left_arm, segmental_fat_mass_trunk, segmental_fat_mass_right_leg, segmental_fat_mass_left_leg
   - Segmental Analysis %: segmental_lean_analysis_right_arm, segmental_lean_analysis_left_arm, segmental_lean_analysis_trunk, segmental_lean_analysis_right_leg, segmental_lean_analysis_left_leg
4. ALL units MUST be in ENGLISH: kg, %, cm, kcal, level, L, ratio, points, grade, Ω
5. Convert all numbers to use dots (77,1 → 77.1)
6. Include confidence score (0.0-1.0) for each field
7. The image may have labels in Polish, Spanish, or other languages - TRANSLATE metric names to English
8. Look for segmental data in tables/charts (arms, legs, trunk)
9. Preserve original text in raw_text field

TRANSLATION EXAMPLES:
- "Waga" → weight
- "Masa mięśniowa" → skeletal_muscle_mass
- "Tłuszcz trzewny" → visceral_fat_level
- "Woda całkowita" → total_body_water
- "Prawa ręka" / "Right Arm" → segmental_lean_mass_right_arm (for lean mass values)
- "Lewa noga" / "Left Leg" → segmental_lean_mass_left_leg

JSON format (compact, no extra text):
[{"metric":"weight","value":77.1,"unit":"kg","raw_text":"Waga: 77,1 kg","confidence":0.96}]

Extract ALL measurements (JSON array only, no markdown):
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
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000, // Increased for more measurements
      temperature: 0.1 // Low temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    
    // Log the raw response for debugging
    console.log('=== OPENAI RESPONSE ===');
    console.log('Full response:', JSON.stringify(response, null, 2));
    console.log('Content:', content);
    console.log('======================');
    
    if (!content) {
      console.error('OpenAI returned no content. Full response:', response);
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response (strip markdown code blocks if present)
    let parsedData: any;
    try {
      // Remove markdown code blocks (```json ... ```)
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```')) {
        // Remove opening ```json or ```
        cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing ```
        cleanContent = cleanContent.replace(/\n?```\s*$/, '');
      }
      
      parsedData = JSON.parse(cleanContent);
      console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse OpenAI response. Raw content:', content);
      console.error('Parse error:', parseError);
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
      .filter(m => m.metric && typeof m.value === 'number')
      .map(m => ({
        metric: m.metric.toLowerCase().trim(),
        value: parseFloat(m.value.toString()),
        unit: (m.unit || '').trim() || 'level', // Default to 'level' if empty
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
