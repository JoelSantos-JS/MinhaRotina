import * as ImageManipulator from 'expo-image-manipulator';

export type CompressedImage = {
  /** base64-encoded JPEG string (without data URI prefix) */
  base64: string;
  /** local file URI of the compressed image */
  uri: string;
};

/**
 * Compresses and resizes an image, returning BOTH the local URI and base64.
 * Using base64 for upload avoids the `fetch(file://).blob()` instability on
 * Android with New Architecture.
 *
 * - Max width: 800 px (preserves aspect ratio)
 * - Format: JPEG, quality 0.75
 */
export async function compressImage(
  uri: string,
  maxSize = 800,
  quality = 0.75
): Promise<CompressedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  return { uri: result.uri, base64: result.base64! };
}

/**
 * Compresses a square profile/avatar photo.
 * - Max width: 400 px, quality 0.8
 */
export async function compressAvatar(uri: string): Promise<CompressedImage> {
  return compressImage(uri, 400, 0.8);
}

/**
 * Converts a base64 string to Uint8Array for direct upload to Supabase Storage,
 * bypassing the unstable `fetch(file://).blob()` path on Android.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
