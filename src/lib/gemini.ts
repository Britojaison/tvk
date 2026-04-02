import {
  CANDIDATE_NAME_TAMIL,
  PARTY_ACRONYM,
  IMAGES,
} from "./constants";
import { compressImageBlob } from "./utils";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

let cachedBaseForAI: { base64: string; mimeType: string } | null = null;
let cachedBaseForCanvas: HTMLImageElement | null = null;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function generateCampaignPhoto(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string> {
  console.log(`[CAMPAIGN AI] Starting with model: ${MODEL}`);

  if (!cachedBaseForAI) {
    try {
      const resp = await fetch(IMAGES.campaignBase);
      const blob = await resp.blob();
      cachedBaseForAI = await compressImageBlob(blob, 1200, 0.92);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error("Failed to load campaign base assets: " + msg);
    }
  }

  if (API_KEY && cachedBaseForAI) {
    try {
      const aiResult = await callGeminiAPI(selfieBase64, selfieMimeType);
      if (aiResult) return aiResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[CAMPAIGN AI] AI Failed:", msg);
      if (msg.includes("Rate limit") || msg.includes("Gemini API Error")) {
        throw new Error("AI API Error: " + msg);
      }
    }
  }

  return generateLocalFallback(selfieBase64);
}

async function callGeminiAPI(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string | null> {
  // New approach: Generate the entire scene as one cohesive photo
  const prompt = `Generate a realistic group selfie photo.

PEOPLE IN THE PHOTO:
- Image 1 shows a person (on the right side of the final photo)
- Image 2 shows two leaders with a TVK backdrop (on the left/center of the final photo)
- Image 3 is the same person from Image 1 (use for face reference)

IMPORTANT: This should look like ONE PHOTO taken with a phone camera, NOT a composite.

SCENE SETUP:
All three people are standing together in front of a TVK party backdrop (red/yellow flag).
They are taking a group selfie — casual, friendly, looking at the camera.

CAMERA & FRAMING:
- Front-facing phone camera (slight wide-angle effect)
- This is the FINAL PHOTO OUTPUT — what you see on the phone screen AFTER taking the selfie
- NO phone visible, NO hands visible, NO arms visible in the frame
- Close-up framing: heads and upper shoulders only, cropped at chest level
- The person from Image 1 is on the RIGHT, slightly closer to camera
- The two leaders are on the LEFT/CENTER, slightly behind
- All three at similar eye level, natural spacing between them
- Clean final result — just the three people and the backdrop

LIGHTING (CRITICAL FOR REALISM):
- Single unified light source illuminating all three people equally
- Warm indoor studio lighting (3500K) from the TVK backdrop
- Soft shadows on all faces in the same direction
- Same light intensity on everyone — no one should look brighter or darker than others
- Natural light falloff and ambient bounce from the red/yellow backdrop

FACE ACCURACY:
- The person's face from Images 1 & 3 must be PIXEL-PERFECT IDENTICAL
- ZERO changes to: eyes (shape, color, size), nose (shape, size), lips (shape, color), teeth (if visible), hair (style, color, texture), cheeks (shape, fullness), forehead (size, shape)
- Same exact skin tone, skin texture, facial hair, expression
- Same exact glasses frames if wearing any
- Do NOT beautify, smooth, or enhance the face in any way
- The person must be instantly recognizable — if their face looks different at all, you have failed
- Think of this as copying their face exactly, not recreating it

REALISM REQUIREMENTS:
- Consistent image quality across the entire photo (same sharpness, same grain, same compression)
- Everyone should have the same level of detail — not one person super sharp and others soft
- Natural depth of field typical of phone selfies (everyone mostly in focus)
- Slight motion blur or natural imperfections throughout
- Unified color grading — everyone affected by the same warm lighting
- No visible edges, halos, or cutout effects around anyone
- The photo should look like it was captured in a single moment, not edited

OUTPUT: A genuine-looking group selfie that appears to be taken with one phone camera in one shot.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: selfieMimeType,
              data: selfieBase64,
            },
          },
          {
            inlineData: {
              mimeType: cachedBaseForAI!.mimeType,
              data: cachedBaseForAI!.base64,
            },
          },
          {
            inlineData: {
              mimeType: selfieMimeType,
              data: selfieBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      temperature: 0, // Zero creativity — strict face preservation
    },
  };

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const errorData = await response.json();
        const retryInfo = errorData.error?.details?.find(
          (d: Record<string, string>) =>
            d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
        );
        let delayMs = 6000;
        if (retryInfo?.retryDelay) {
          const seconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
          if (!isNaN(seconds)) delayMs = seconds * 1000 + 1000;
        }
        retries++;
        if (retries >= maxRetries) {
          throw new Error("Rate limit exceeded multiple times.");
        }
        console.warn(`[AI] 429 — retrying in ${Math.round(delayMs / 1000)}s`);
        await delay(delayMs);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API Error: ${response.status} - ${errorText.substring(0, 100)}`
        );
      }

      const data = await response.json();
      const imgPart = data.candidates?.[0]?.content?.parts?.find(
        (p: Record<string, unknown>) => p.inlineData
      );

      if (imgPart?.inlineData?.data) {
        return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
      }

      return null;
    } catch (e: unknown) {
      const isNetwork =
        e instanceof Error &&
        (e.name === "AbortError" || e.message?.includes("fetch"));
      if (isNetwork) {
        retries++;
        if (retries >= maxRetries)
          throw new Error("Network request failed after retries.");
        await delay(3000);
        continue;
      }
      throw e;
    }
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function generateLocalFallback(selfieBase64: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas Error");

  const [baseImg, userImg] = await Promise.all([
    cachedBaseForCanvas
      ? Promise.resolve(cachedBaseForCanvas)
      : loadImage(IMAGES.campaignBase).then((i) => {
          cachedBaseForCanvas = i;
          return i;
        }),
    loadImage(`data:image/jpeg;base64,${selfieBase64}`),
  ]);

  ctx.drawImage(baseImg, 0, 0, 1080, 1080);

  const targetW = 480;
  const targetH = 1000;
  const targetX = 600;
  const targetY = 120;

  const layer = document.createElement("canvas");
  layer.width = targetW;
  layer.height = targetH;
  const lctx = layer.getContext("2d")!;

  const aspect = userImg.width / userImg.height;
  let sW = userImg.width,
    sH = userImg.height,
    sX = 0,
    sY = 0;
  if (aspect > targetW / targetH) {
    sW = userImg.height * (targetW / targetH);
    sX = (userImg.width - sW) / 2;
  } else {
    sH = userImg.width * (targetH / targetW);
    sY = (userImg.height - sH) / 2;
  }
  lctx.drawImage(userImg, sX, sY, sW, sH, 0, 0, targetW, targetH);

  lctx.globalCompositeOperation = "destination-in";
  const grad = lctx.createRadialGradient(
    targetW * 0.5, targetH * 0.45, 100,
    targetW * 0.5, targetH * 0.5, 600
  );
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(0.6, "rgba(0,0,0,0.95)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  lctx.fillStyle = grad;
  lctx.fillRect(0, 0, targetW, targetH);

  const fadeGrad = lctx.createLinearGradient(0, 0, 120, 0);
  fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
  fadeGrad.addColorStop(1, "rgba(0,0,0,1)");
  lctx.fillStyle = fadeGrad;
  lctx.fillRect(0, 0, 120, targetH);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = -20;
  ctx.drawImage(layer, targetX, targetY);
  ctx.restore();

  const overlay = document.createElement("canvas");
  overlay.width = 1080;
  overlay.height = 1080;
  const octx = overlay.getContext("2d")!;
  const partyGrad = octx.createRadialGradient(540, 500, 200, 540, 540, 1080);
  partyGrad.addColorStop(0, "rgba(245, 168, 0, 0.15)");
  partyGrad.addColorStop(0.7, "rgba(200, 16, 46, 0.12)");
  partyGrad.addColorStop(1, "rgba(160, 13, 36, 0.25)");
  octx.fillStyle = partyGrad;
  octx.fillRect(0, 0, 1080, 1080);

  ctx.globalCompositeOperation = "hard-light";
  ctx.globalAlpha = 0.55;
  ctx.drawImage(overlay, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "#C8102E";
  ctx.fillRect(0, 1000, 1080, 80);
  ctx.fillStyle = "#F5A800";
  ctx.fillRect(0, 1000, 1080, 4);
  ctx.font = "800 32px Lexend, sans-serif";
  ctx.fillStyle = "#F5A800";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText(
    `${CANDIDATE_NAME_TAMIL} | ${PARTY_ACRONYM} 2026`,
    540,
    1052
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}
