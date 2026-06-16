import { normalizePickedImageUriForUpload } from "@/utils/normalizePickedImageUriForUpload";

export type ServiceImageUploadPart = {
  uri: string;
  name: string;
  type: "image/jpeg";
};

/** Build multipart image parts for service create/update (file:// JPEG, safe for Android content://). */
export async function buildServiceImageUploadParts(
  images: unknown[],
): Promise<ServiceImageUploadPart[]> {
  const parts: ServiceImageUploadPart[] = [];

  for (let index = 0; index < images.length; index++) {
    const raw = images[index];
    if (typeof raw !== "string" || !raw.trim()) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) continue;

    const normalizedUri = await normalizePickedImageUriForUpload(raw);
    parts.push({
      uri: normalizedUri,
      name: `service_${Date.now()}_${index}.jpg`,
      type: "image/jpeg",
    });
  }

  return parts;
}
