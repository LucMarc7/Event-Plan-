// src/utils/imageCompression.ts
import * as ImageManipulator from "expo-image-manipulator";

const MAX_WIDTH = 1200;
const QUALITY = 0.75;

/**
 * Compresse une image locale (file://) en JPEG ≤ 1200px.
 * Retourne { uri, name, type } compatible avec FormData.
 */
export async function compressImage(
  uri: string,
  fileName = "event_image.jpg",
): Promise<{ uri: string; name: string; type: string }> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      {
        compress: QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      uri: result.uri,
      name: fileName.replace(/\.(png|jpeg|jpg|webp)$/i, ".jpg"),
      type: "image/jpeg",
    };
  } catch (err) {
    console.warn("[compressImage] échec, fallback URI original:", err);
    return { uri, name: fileName, type: "image/jpeg" };
  }
}
