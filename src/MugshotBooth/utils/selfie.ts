// Crop / resize an uploaded selfie to a 4:5 portrait JPEG before upload.
//
// Why pre-crop:
//   The gen-image endpoint inherits the ref image's aspect ratio. We want
//   a vertical portrait mugshot, so we hand it a 4:5 ref. Also caps the
//   long side at ~1024px to keep the upload small.

const TARGET_W = 800;
const TARGET_H = 1000; // 4:5

export async function prepareSelfie(file: File): Promise<Blob> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const srcRatio = srcW / srcH;
  const targetRatio = TARGET_W / TARGET_H;

  // Compute centered crop rect on the source.
  let cropW: number;
  let cropH: number;
  if (srcRatio > targetRatio) {
    // Source wider — crop sides.
    cropH = srcH;
    cropW = srcH * targetRatio;
  } else {
    // Source taller — crop top/bottom. Bias crop upward to keep faces in frame.
    cropW = srcW;
    cropH = srcW / targetRatio;
  }
  const cropX = (srcW - cropW) / 2;
  // Bias 15% toward the top of the frame — faces tend to be in the upper third.
  const cropY = Math.max(0, (srcH - cropH) / 2 - cropH * 0.08);

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('selfie: could not get canvas 2d context');
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, TARGET_W, TARGET_H);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('selfie: canvas.toBlob returned null'));
      },
      'image/jpeg',
      0.88,
    );
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error || new Error('selfie: FileReader failed'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('selfie: image load failed'));
    img.src = src;
  });
}

/** Make an object URL from a file for preview. Caller must revoke. */
export function previewURL(file: File): string {
  return URL.createObjectURL(file);
}
