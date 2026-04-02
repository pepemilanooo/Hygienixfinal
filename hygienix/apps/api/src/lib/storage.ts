import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME, getPublicUrl } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const ext = filename.split('.').pop() || 'bin';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key, url: getPublicUrl(key) };
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  );
}

export async function getPresignedUploadUrl(
  folder: string,
  filename: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<{ url: string; key: string }> {
  const ext = filename.split('.').pop() || 'bin';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  return { url, key };
}

// Salva base64 (firma digitale) come PNG
export async function uploadBase64Image(
  base64Data: string,
  folder: string
): Promise<UploadResult> {
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  return uploadBuffer(buffer, folder, 'signature.png', 'image/png');
}
