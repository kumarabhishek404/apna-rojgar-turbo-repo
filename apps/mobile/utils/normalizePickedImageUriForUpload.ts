import * as ImageManipulator from "expo-image-manipulator";

/**
 * Gallery / file manager picks often return content:// or ph:// URIs that React Native
 * multipart uploads cannot read reliably. Decode into a cache file:// JPEG.
 */
export async function normalizePickedImageUriForUpload(uri: string): Promise<string> {
  try {
    const normalized = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return normalized.uri;
  } catch (e) {
    console.warn(
      "[normalizePickedImageUriForUpload] could not normalize, using original URI",
      e,
    );
    return uri;
  }
}
