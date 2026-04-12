import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export function getR2Client() {
    return new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT!, // e.g. https://<account_id>.r2.cloudflarestorage.com
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
    });
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'food-comments-bucket'

export async function generateUploadUrl(key: string, contentType: string) {
    const client = getR2Client()
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
    })
    return await getSignedUrl(client, command, { expiresIn: 3600 })
}

export async function deleteR2Object(key: string) {
    const client = getR2Client()
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
    })
    await client.send(command)
}
