// lib/imageCompression.ts
//
// Client-side image compression. Shrinking in the browser means a 6 MB phone
// photo leaves the device as ~200 KB, so the upload is fast and the server's
// size limit is not hit by something the user would consider a normal photo.
//
// The server re-encodes everything again through Cloudinary — this is an
// optimisation and a UX guard, never the security boundary.

/** Mirrors UPLOAD_LIMITS in backend/middleware/upload.middleware.ts. */
export const UPLOAD_RULES = {
    avatar: {
        maxBytes: 5 * 1024 * 1024,
        accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
        // What the compressor aims for before the request is sent.
        maxDimension: 1024,
        targetBytes: 300 * 1024,
        hint: "JPG, PNG, WEBP, GIF or AVIF · up to 5 MB",
    },
    attachment: {
        maxBytes: 10 * 1024 * 1024,
        maxFiles: 10,
        accept:
            "image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml," +
            "application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip",
        mimeTypes: [
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/csv",
            "application/zip",
        ],
        maxDimension: 1920,
        targetBytes: 800 * 1024,
        hint: "Images, PDF, Office docs, TXT, CSV or ZIP · up to 10 MB each, 10 at a time",
    },
} as const;

export type UploadKind = keyof typeof UPLOAD_RULES;

export function formatBytes(bytes: number): string {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** SVG is markup and GIF may be animated — canvas would destroy both. */
function isCompressible(file: File): boolean {
    return (
        file.type.startsWith("image/") &&
        file.type !== "image/svg+xml" &&
        file.type !== "image/gif"
    );
}

export interface ValidationResult {
    ok: boolean;
    error?: string;
}

/** Checked before compression so the user hears about a bad file immediately. */
export function validateFile(file: File, kind: UploadKind): ValidationResult {
    const rules = UPLOAD_RULES[kind];

    if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
        return { ok: false, error: `${file.name}: unsupported file type` };
    }

    if (file.size > rules.maxBytes) {
        return {
            ok: false,
            error: `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(rules.maxBytes)}`,
        };
    }

    return { ok: true };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
    if (typeof createImageBitmap === "function") {
        return createImageBitmap(file);
    }

    // Safari < 17 has no createImageBitmap for File — fall back to an <img>.
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("Could not decode image"));
            el.src = url;
        });
        return await createImageBitmap(img);
    } finally {
        URL.revokeObjectURL(url);
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export interface CompressOptions {
    maxDimension?: number;
    targetBytes?: number;
    /** Lowest quality the loop is allowed to drop to before giving up. */
    minQuality?: number;
}

/**
 * Scales the image down to `maxDimension` on its longest side, then steps the
 * encoder quality down until the result fits `targetBytes`. Returns the original
 * file untouched when it cannot be improved on (SVG, GIF, already-small images,
 * or a browser that fails to encode).
 */
export async function compressImage(
    file: File,
    kind: UploadKind = "attachment",
    options: CompressOptions = {}
): Promise<File> {
    if (!isCompressible(file)) return file;

    const rules = UPLOAD_RULES[kind];
    const maxDimension = options.maxDimension ?? rules.maxDimension;
    const targetBytes = options.targetBytes ?? rules.targetBytes;
    const minQuality = options.minQuality ?? 0.5;

    try {
        const bitmap = await loadBitmap(file);

        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        // Nothing to gain: already small enough in both dimensions and bytes.
        if (scale === 1 && file.size <= targetBytes) {
            bitmap.close?.();
            return file;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            bitmap.close?.();
            return file;
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();

        // WEBP is the smaller encoder; PNG-with-alpha stays PNG only if WEBP fails.
        const outputType = "image/webp";
        let blob: Blob | null = null;

        for (let quality = 0.82; quality >= minQuality; quality -= 0.12) {
            blob = await canvasToBlob(canvas, outputType, quality);
            if (blob && blob.size <= targetBytes) break;
        }

        if (!blob) {
            blob = await canvasToBlob(canvas, "image/jpeg", 0.8);
        }

        // A "compressed" file bigger than the original is a failed compression.
        if (!blob || blob.size >= file.size) return file;

        const name = file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg");

        return new File([blob], name, { type: blob.type, lastModified: Date.now() });

    } catch (error) {
        console.warn("Image compression failed, uploading original:", error);
        return file;
    }
}

/** Compresses a batch, keeping non-images and failures as-is. */
export async function compressAll(files: File[], kind: UploadKind = "attachment"): Promise<File[]> {
    return Promise.all(files.map((f) => compressImage(f, kind)));
}

/** Local object URL for an instant preview while the real upload is in flight. */
export function previewUrl(file: File): string {
    return URL.createObjectURL(file);
}
