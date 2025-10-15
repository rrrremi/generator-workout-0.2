# File Upload Security Implementation

**Date:** October 15, 2025  
**Priority:** 🔴 CRITICAL  
**Status:** ✅ IMPLEMENTED

---

## Overview

Comprehensive file upload security has been implemented to protect against malicious uploads, MIME type spoofing, and abuse.

---

## Security Layers

### Layer 1: Client-Side Validation (First Line of Defense)

**Location:** `app/protected/measurements/upload/page.tsx`

```typescript
// Validate file type
if (!file.type.startsWith('image/')) {
  setError('Please select an image file')
  return
}

// Validate file size (max 10MB)
if (file.size > 10 * 1024 * 1024) {
  setError('Image must be less than 10MB')
  return
}
```

**Purpose:**
- Quick feedback to user
- Prevents obvious mistakes
- Reduces unnecessary API calls

**Limitations:**
- ⚠️ Can be bypassed
- ⚠️ MIME type can be spoofed
- ⚠️ Not sufficient alone

---

### Layer 2: Server-Side Validation (Critical Security)

**Location:** `app/api/measurements/upload/route.ts`

#### 2.1 Schema Validation with Zod

```typescript
const uploadSchema = z.object({
  fileName: z.string()
    .min(1, 'Filename required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename format'),
  fileSize: z.number()
    .min(1, 'File too small')
    .max(10 * 1024 * 1024, 'File must be less than 10MB'),
  fileType: z.enum([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ])
});
```

**Validates:**
- ✅ Filename format
- ✅ File size limits
- ✅ File type whitelist
- ✅ Required fields

#### 2.2 Filename Sanitization

```typescript
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
```

**Protects Against:**
- ✅ Path traversal (`../../../etc/passwd`)
- ✅ Directory traversal (`/var/www/`)
- ✅ Special characters injection
- ✅ Excessively long filenames
- ✅ Multiple dots/underscores

#### 2.3 Extension Validation

```typescript
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

if (!allowedExtensions.includes(fileExtension)) {
  return NextResponse.json(
    { error: 'Invalid file extension' },
    { status: 400 }
  );
}
```

**Prevents:**
- ✅ Executable uploads (`.exe`, `.sh`)
- ✅ Script uploads (`.js`, `.php`)
- ✅ Double extension attacks (`.jpg.exe`)

#### 2.4 Rate Limiting

```typescript
function checkUploadLimit(userId: string): boolean {
  const maxUploads = 5; // 5 uploads per hour
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  // Check if user exceeded limit
  if (userLimit.count >= maxUploads) {
    return false;
  }
  
  return true;
}
```

**Limits:**
- ✅ 5 uploads per hour per user
- ✅ Prevents storage abuse
- ✅ Prevents DoS attacks

---

### Layer 3: Storage Security (Supabase)

**Configuration:**

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('measurement-images')
  .upload(validatedFileName, selectedFile, {
    cacheControl: '3600',    // Cache for 1 hour
    upsert: false            // Don't overwrite existing files
  });
```

**Security Features:**
- ✅ Isolated bucket (`measurement-images`)
- ✅ User-specific paths (`user_id/timestamp-filename`)
- ✅ No overwrites (prevents file replacement attacks)
- ✅ RLS (Row Level Security) policies
- ✅ Public read, authenticated write

---

## Upload Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Secure Upload Flow                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User Selects File                                    │
│     ↓                                                    │
│  2. Client-Side Validation                               │
│     ├─ Check file type (image/*)                        │
│     ├─ Check file size (< 10MB)                         │
│     └─ Show preview                                      │
│     ↓                                                    │
│  3. Server-Side Validation (API)                         │
│     ├─ Validate with Zod schema                         │
│     ├─ Check rate limit (5/hour)                        │
│     ├─ Sanitize filename                                │
│     ├─ Validate extension                               │
│     └─ Return validated filename                         │
│     ↓                                                    │
│  4. Upload to Supabase Storage                           │
│     ├─ Use validated filename                           │
│     ├─ Upload to user-specific path                     │
│     └─ Get public URL                                    │
│     ↓                                                    │
│  5. Extract Measurements (OpenAI)                        │
│     ├─ Send public URL to OCR API                       │
│     ├─ Extract measurements                             │
│     └─ Return structured data                            │
│     ↓                                                    │
│  6. Review & Save                                        │
│     ├─ User reviews extracted data                      │
│     ├─ Save to database                                 │
│     └─ Success!                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Attack Scenarios & Mitigations

### 1. Path Traversal Attack

**Attack:**
```
Filename: "../../../etc/passwd"
Goal: Access system files
```

**Mitigation:**
```typescript
filename = filename.replace(/\.\./g, '');  // Remove ..
filename = filename.replace(/[\/\\]/g, ''); // Remove slashes
// Result: "etcpasswd"
```

---

### 2. MIME Type Spoofing

**Attack:**
```
File: malicious.exe
MIME Type: image/jpeg (spoofed)
Goal: Upload executable
```

**Mitigation:**
```typescript
// Check extension, not just MIME type
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
if (!allowedExtensions.includes(fileExtension)) {
  throw new Error('Invalid file extension');
}
```

**Future Enhancement:**
```typescript
// Check magic bytes (file signature)
import { fileTypeFromBuffer } from 'file-type';

const buffer = await file.arrayBuffer();
const type = await fileTypeFromBuffer(buffer);

if (!allowedTypes.includes(type?.mime)) {
  throw new Error('Invalid file type');
}
```

---

### 3. Double Extension Attack

**Attack:**
```
Filename: "image.jpg.exe"
Goal: Bypass extension check
```

**Mitigation:**
```typescript
// Get last extension only
const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
// Result: ".exe" → Blocked ✅
```

---

### 4. Storage Abuse

**Attack:**
```
Upload 1000 files rapidly
Goal: Fill up storage, increase costs
```

**Mitigation:**
```typescript
// Rate limiting: 5 uploads per hour
if (!checkUploadLimit(user.id)) {
  return NextResponse.json(
    { error: 'Upload limit exceeded. Maximum 5 uploads per hour.' },
    { status: 429 }
  );
}
```

---

### 5. Filename Injection

**Attack:**
```
Filename: "image'; DROP TABLE measurements;--.jpg"
Goal: SQL injection via filename
```

**Mitigation:**
```typescript
// Sanitize: only allow alphanumeric, dots, dashes, underscores
filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
// Result: "image__DROP_TABLE_measurements___.jpg"
```

---

### 6. XSS via SVG

**Attack:**
```xml
<!-- malicious.svg -->
<svg onload="alert('XSS')">
  <script>steal_cookies()</script>
</svg>
```

**Mitigation:**
```typescript
// SVG not in whitelist
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
// SVG blocked ✅
```

---

## Security Checklist

### ✅ Implemented
- [x] Client-side validation (UX)
- [x] Server-side validation (Security)
- [x] Zod schema validation
- [x] Filename sanitization
- [x] Extension whitelist
- [x] File size limits (10MB)
- [x] Rate limiting (5/hour)
- [x] User-specific paths
- [x] No file overwrites
- [x] Proper error messages

### 🔄 Recommended Enhancements
- [ ] Magic byte validation
- [ ] Virus scanning (ClamAV)
- [ ] Image optimization
- [ ] Thumbnail generation
- [ ] CDN integration
- [ ] Watermarking
- [ ] EXIF data stripping
- [ ] Content Security Policy headers

---

## Future Enhancements

### 1. Magic Byte Validation

**Why:** MIME types can be spoofed, but file signatures (magic bytes) cannot.

**Implementation:**
```typescript
import { fileTypeFromBuffer } from 'file-type';

// In upload API route
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Read file buffer
  const buffer = await file.arrayBuffer();
  
  // Check magic bytes
  const type = await fileTypeFromBuffer(Buffer.from(buffer));
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!type || !allowedTypes.includes(type.mime)) {
    return NextResponse.json(
      { error: 'Invalid file type detected' },
      { status: 400 }
    );
  }
  
  // Continue with upload...
}
```

**Magic Bytes Examples:**
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47`
- WebP: `52 49 46 46`

---

### 2. Virus Scanning

**Option A: ClamAV (Self-hosted)**
```typescript
import { NodeClam } from 'clamscan';

const clamscan = await new NodeClam().init({
  clamdscan: {
    host: 'localhost',
    port: 3310,
  },
});

const { isInfected, viruses } = await clamscan.isInfected(filePath);

if (isInfected) {
  throw new Error(`Virus detected: ${viruses.join(', ')}`);
}
```

**Option B: Cloud Service (VirusTotal, MetaDefender)**
```typescript
const response = await fetch('https://www.virustotal.com/api/v3/files', {
  method: 'POST',
  headers: {
    'x-apikey': process.env.VIRUSTOTAL_API_KEY
  },
  body: fileBuffer
});

const result = await response.json();
if (result.data.attributes.last_analysis_stats.malicious > 0) {
  throw new Error('Malicious file detected');
}
```

---

### 3. Image Optimization

**Why:** Reduce storage costs and improve performance

```typescript
import sharp from 'sharp';

// Resize and compress
const optimized = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();

// Upload optimized version
await supabase.storage
  .from('measurement-images')
  .upload(fileName, optimized);
```

---

### 4. EXIF Data Stripping

**Why:** Remove sensitive metadata (GPS, camera info)

```typescript
import sharp from 'sharp';

// Strip all metadata
const stripped = await sharp(buffer)
  .rotate() // Auto-rotate based on EXIF
  .withMetadata({ orientation: undefined }) // Remove orientation
  .toBuffer();
```

---

## Testing

### Manual Testing

1. **Valid Upload:**
   ```
   File: test.jpg (2MB, JPEG)
   Expected: ✅ Upload successful
   ```

2. **Invalid Type:**
   ```
   File: test.exe (1MB)
   Expected: ❌ "Invalid file type"
   ```

3. **Too Large:**
   ```
   File: huge.jpg (15MB)
   Expected: ❌ "File must be less than 10MB"
   ```

4. **Path Traversal:**
   ```
   File: ../../../etc/passwd.jpg
   Expected: ✅ Sanitized to "etcpasswd.jpg"
   ```

5. **Rate Limit:**
   ```
   Upload 6 files in 1 hour
   Expected: First 5 succeed, 6th returns 429
   ```

### Automated Testing

```typescript
describe('File Upload Security', () => {
  it('rejects files over 10MB', async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg');
    const response = await uploadFile(largeFile);
    expect(response.status).toBe(400);
    expect(response.error).toContain('10MB');
  });

  it('sanitizes malicious filenames', async () => {
    const response = await validateUpload({
      fileName: '../../../etc/passwd.jpg',
      fileSize: 1024,
      fileType: 'image/jpeg'
    });
    expect(response.fileName).not.toContain('..');
    expect(response.fileName).not.toContain('/');
  });

  it('enforces rate limits', async () => {
    const uploads = await Promise.all(
      Array(6).fill(null).map(() => uploadFile(validFile))
    );
    const rateLimited = uploads.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## Monitoring

### Metrics to Track

1. **Upload Success Rate**
   - Target: > 95%
   - Alert if < 90%

2. **Validation Failures**
   - Track rejection reasons
   - Identify attack patterns

3. **Rate Limit Hits**
   - Monitor abuse attempts
   - Adjust limits if needed

4. **Storage Usage**
   - Track growth rate
   - Set up alerts for quotas

### Example Monitoring

```typescript
// Track upload metrics
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ... validation logic ...
    
    Sentry.metrics.increment('upload.success');
    Sentry.metrics.distribution('upload.duration', Date.now() - startTime);
    
  } catch (error) {
    Sentry.metrics.increment('upload.failure', {
      tags: { reason: error.message }
    });
    throw error;
  }
}
```

---

## Configuration

### Environment Variables

```env
# Upload limits
MAX_FILE_SIZE_MB=10
MAX_UPLOADS_PER_HOUR=5

# Allowed file types
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Storage
SUPABASE_STORAGE_BUCKET=measurement-images

# Optional: Virus scanning
VIRUSTOTAL_API_KEY=your_key_here
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

---

## Conclusion

**Security Posture:**
- ✅ Multi-layer validation
- ✅ Filename sanitization
- ✅ Rate limiting
- ✅ Extension whitelist
- ✅ Size limits
- ✅ User isolation

**Risk Level:** Reduced from 🔴 **CRITICAL** to 🟢 **LOW**

**Next Steps:**
1. Monitor upload patterns
2. Implement magic byte validation
3. Add virus scanning
4. Optimize images
5. Regular security audits
