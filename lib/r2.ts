export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'food-comments-bucket'

// R2バインディングを取得するヘルパー関数
export function getR2Binding() {
    if (typeof process !== 'undefined' && process.env && (process.env as any).R2) {
        return (process.env as any).R2 as any; // R2Bucket
    }
    return null;
}

export async function uploadImageToR2(key: string, fileBuffer: ArrayBuffer | Blob, contentType: string) {
    const r2 = getR2Binding()
    if (r2) {
        await r2.put(key, fileBuffer, {
            httpMetadata: { contentType },
        })
        return true
    } else {
        console.warn('R2 Binding is not available. Skipping real upload (Local Mode).');
        return false;
    }
}

export async function deleteR2Object(key: string) {
    const r2 = getR2Binding()
    if (r2) {
        await r2.delete(key)
    } else {
        console.warn('R2 Binding is not available. Skipping deletion.');
    }
}
