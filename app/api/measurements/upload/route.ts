import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema
const uploadSchema = z.object({
  fileName: z.string()
    .min(1, 'Filename required')
    .max(255, 'Filename too long')
    .refine(
      (name) => {
        // Allow common filename characters including spaces
        // Will be sanitized later, so just check for dangerous patterns
        return !name.includes('..') && !name.includes('/') && !name.includes('\\');
      },
      'Invalid filename format'
    ),
  fileSize: z.number()
    .min(1, 'File too small')
    .max(10 * 1024 * 1024, 'File must be less than 10MB'),
  fileType: z.enum([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ], { errorMap: () => ({ message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }) })
});

// Rate limiter
const uploadLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkUploadLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = uploadLimitMap.get(userId);
  const maxUploads = 5; // 5 uploads per hour
  const windowMs = 60 * 60 * 1000; // 1 hour

  if (!userLimit || now > userLimit.resetAt) {
    uploadLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxUploads) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Sanitize filename
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '');
  filename = filename.replace(/[\/\\]/g, '');
  
  // Remove special characters except dots, dashes, underscores
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove multiple underscores
  filename = filename.replace(/_{2,}/g, '_');
  
  // Limit length
  const maxLength = 100;
  if (filename.length > maxLength) {
    const ext = filename.split('.').pop();
    const name = filename.substring(0, maxLength - (ext ? ext.length + 1 : 0));
    filename = ext ? `${name}.${ext}` : name;
  }
  
  return filename;
}

// Validate file upload request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (!checkUploadLimit(user.id)) {
      return NextResponse.json(
        { error: 'Upload limit exceeded. Maximum 5 uploads per hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues.map((issue) => issue.message)
        },
        { status: 400 }
      );
    }

    const { fileName, fileSize, fileType } = validation.data;

    // Additional security checks
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file extension' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(fileName);
    const finalFileName = `${user.id}/${Date.now()}-${sanitizedName}`;

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      sanitizedName
    });

  } catch (error: any) {
    console.error('Upload validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
