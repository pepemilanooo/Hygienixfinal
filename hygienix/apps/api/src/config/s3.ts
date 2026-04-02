import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: !!process.env.S3_ENDPOINT, // necessario per MinIO e R2
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'hygienix-storage';
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || '';

export function getPublicUrl(key: string): string {
  if (S3_PUBLIC_URL) return `${S3_PUBLIC_URL}/${key}`;
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
