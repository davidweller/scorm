import { put, del } from "@vercel/blob";

const BLOB_STORE = process.env.BLOB_READ_WRITE_TOKEN ? "vercel" : "none";

export async function uploadBlob(
  pathname: string,
  body: Blob | Buffer | ReadableStream,
  options?: { contentType?: string }
): Promise<{ url: string }> {
  if (BLOB_STORE !== "vercel") {
    throw new Error("Blob storage not configured. Set BLOB_READ_WRITE_TOKEN.");
  }
  const blob = await put(pathname, body, {
    access: "public",
    contentType: options?.contentType,
  });
  return { url: blob.url };
}

export async function deleteBlob(url: string): Promise<void> {
  if (BLOB_STORE !== "vercel") return;
  await del(url);
}

export function isBlobConfigured(): boolean {
  return BLOB_STORE === "vercel";
}
