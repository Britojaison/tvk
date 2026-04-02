/**
 * Convert a file/blob to base64 string (without the data URI prefix)
 */
export async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URI prefix like "data:image/jpeg;base64,"
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress/resize an image blob using canvas
 * Ensures images are max 1024px and compressed as JPEG
 */
export async function compressImageBlob(
  blob: Blob,
  maxSize: number = 1024,
  quality: number = 0.8
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const dataURL = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataURL.split(",")[1];

      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

/**
 * Fetch an image from a URL, compress it, and return its base64 and mime type
 */
export async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    // Always compress to ensure reasonable size for API
    const compressed = await compressImageBlob(blob, 1024, 0.85);
    console.log(`Image ${url}: compressed to ~${Math.round(compressed.base64.length / 1024)}KB`);
    return compressed;
  } catch (err) {
    console.error(`Failed to fetch/compress image: ${url}`, err);
    return null;
  }
}

/**
 * Convert a canvas data URL to a Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download an image from a base64 string or data URL
 */
export function downloadImage(dataURL: string, filename: string = "tvk-campaign-photo.jpg") {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Share on WhatsApp with a pre-written message
 */
export function shareOnWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

/**
 * Use Web Share API to share image
 */
export async function nativeShare(
  imageDataURL: string,
  title: string,
  text: string
): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) return false;

  try {
    const blob = dataURLtoBlob(imageDataURL);
    const file = new File([blob], "tvk-campaign-photo.jpg", { type: "image/jpeg" });

    const shareData: ShareData = {
      title,
      text,
      files: [file],
    };

    if (!navigator.canShare(shareData)) return false;

    await navigator.share(shareData);
    return true;
  } catch (error) {
    // User may have cancelled the share
    console.log("Share cancelled or failed:", error);
    return false;
  }
}
