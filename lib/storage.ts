import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.MINIO_ENDPOINT!;
const bucketName = process.env.MINIO_BUCKET_NAME!;
const accessKeyId = process.env.MINIO_ROOT_USER!;
const secretAccessKey = process.env.MINIO_ROOT_PASSWORD!;

// Public base URL for accessing uploaded files directly
// In production this should be the public-facing URL; for local it points to MinIO
const publicBaseUrl = process.env.MINIO_PUBLIC_URL || endpoint.replace(/\/+$/, '') + '/' + bucketName;

const s3 = new S3Client({
  endpoint,
  region: 'ap-southeast-3', // required by AWS SDK even for MinIO
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true, // required for MinIO path-style URLs
});

/**
 * Upload a file buffer to MinIO / S3.
 * @param buffer    Raw file data
 * @param key       Object key (path) inside the bucket, e.g. "assessments/abc.jpg"
 * @param contentType  MIME type, e.g. "image/jpeg"
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${publicBaseUrl}/${key}`;
}

/**
 * Delete a file from MinIO / S3 by its object key.
 * @param key  Object key inside the bucket
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Extract the object key from a full storage URL.
 * Example: "http://localhost:9000/media/assessments/abc.jpg" → "assessments/abc.jpg"
 */
export function urlToKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Path looks like /<bucketName>/<key...>
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2 || parts[0] !== bucketName) return null;
    return parts.slice(1).join('/');
  } catch {
    return null;
  }
}
