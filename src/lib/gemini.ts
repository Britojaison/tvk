import {
  CANDIDATE_NAME,
  CANDIDATE_NAME_TAMIL,
  PARTY_ACRONYM,
  IMAGES,
} from "./constants";
import { compressImageBlob } from "./utils";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// Updated to explicitly ask for the working image generation model
const MODEL = "gemini-3.1-flash-image-preview"; // The stable Nano Banana for 2026
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

let cachedBaseForAI: { base64: string; mimeType: string } | null = null;
let cachedBaseForCanvas: HTMLImageElement | null = null;

// Helper to reliably delay for retry logic
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function generateCampaignPhoto(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string> {
  console.log(`[CAMPAIGN AI] Starting Nano Banana Fusion with model: ${MODEL}`);

  // Ensure base image is ready
  if (!cachedBaseForAI) {
    try {
      console.log("[CAMPAIGN AI] Loading base campaign assets...");
      const resp = await fetch(IMAGES.campaignBase);
      const blob = await resp.blob();
      // Compress to ~800px for speed while keeping quality
      cachedBaseForAI = await compressImageBlob(blob, 1200, 0.90);
    } catch (e: any) {
      console.error("[CAMPAIGN AI] Asset Error:", e);
      throw new Error("Failed to load campaign base assets: " + e.message);
    }
  }

  if (API_KEY && cachedBaseForAI) {
    try {
      console.log(`[CAMPAIGN AI] Sending request to Gemini (${MODEL})...`);
      const aiResult = await generateWithDeepBlendAI(selfieBase64, selfieMimeType);

      if (aiResult) {
        console.log("[CAMPAIGN AI] AI Success!");
        return aiResult;
      }

      console.warn("[CAMPAIGN AI] AI returned no image. Checking fallback...");
    } catch (err: any) {
      console.error("[CAMPAIGN AI] AI Request Failed:", err);
      // Important: Bubble up specific rate limiting and critical errors instead of silently hiding them behind a fallback
      if (err.message && (err.message.includes("Rate limit exceeded") || err.message.includes("Gemini API Error"))) {
        throw new Error("AI API Error: " + err.message);
      }
    }
  } else if (!API_KEY) {
    console.error("[CAMPAIGN AI] CRITICAL: NEXT_PUBLIC_GEMINI_API_KEY is missing!");
  }

  console.log("[CAMPAIGN AI] Using local composite engine...");
  return generatePremiumLocalComposite(selfieBase64);
}

async function generateWithDeepBlendAI(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string | null> {
  // Prompt: Extract exact features + subtle cinematic beautification (the "campaign poster glow-up")
  const prompt = `Task: Generate an ultra-high definition, cinematic GROUP SELFIE IMAGE.

=== COMPOSITION ===
Perspective: This is the FINAL SELFIE PHOTO taken from the person's phone camera.
Layout: The person from Image 1 is in the foreground on the RIGHT side. Immediately next to them are the two leaders from Image 2 (Vijay Thalapathy and the candidate).
Important: DO NOT SHOW any phones, cameras, or extended arms. This is the clean, high-quality final output.

=== BACKGROUND & LIGHTING (THE "STUDIO UNIFICATION" RULE) ===
Setting: A high-end professional studio setup with a vibrant TVK party backdrop (Yellow center, Red bands, Golden Elephant icons).
Atmosphere: The environment is saturated with warm Light Gold and Soft Red ambient light reflecting from the party flag background.
Unified Lighting: The person from Image 1, Vijay Thalapathy, and the Candidate must ALL be illuminated by the SAME light source. Apply a warm, golden-hour studio tint (3200K-4000K) across all three faces. 
Light Wrap: Apply a subtle "light wrap" where the warm yellow glow of the background slightly bleeds onto the edges of everyone's hair, ears, and shoulders to "glue" them into the scene.

=== ATMOSPHERIC INTEGRATION — MAKE IT REAL ===
- UNIFIED COLOR GRADE: The cold/cool tones from Image 1 MUST be discarded. The person's skin MUST be warmed up to match the yellowish-orange skin tones of the leaders in Image 2. They must look like they are standing in the same room.
- UNIFIED SHADOWS: Analyze the soft shadows on the leaders' faces (Image 2) and replicate them EXACTLY on the person's face. If the light comes from the front-left for them, it MUST come from the front-left for the person too.
- MATCH GRAIN & FOCUS: The focus level (depth of field) and digital noise/grain MUST be identical across all three people. Ensure the person in the foreground does not look "sharper" or "flatter" than the leaders. 
- NATURAL OCCLUSION: Where the person stands "next" to the leaders, add appropriate contact shadows and soft ambient occlusion between their shoulders.

=== FACE FEATURE EXTRACTION — FORENSIC ACCURACY ===
Analyze the person in Image 1 with EXTREME precision. Extract and reproduce these features EXACTLY:

**EYES** — The most recognizable feature. Get these RIGHT:
- EXACT eye shape (round/almond/hooded/monolid/deep-set), EXACT iris color and shade
- EXACT eye spacing, eye openness level, and gaze direction
- Preserve the EXACT pupil-to-iris-to-white ratio
- Keep eyelash length and density as-is
- Apply the same warm catchlight reflections in the eyes as the leaders have

**EYEBROWS** — Critical for identity:
- EXACT shape, arch, thickness, taper, color, and density
- Preserve any natural asymmetry — do NOT "fix" or symmetrize them

**HAIR** — Instantly recognizable, must be exact:
- EXACT hair color (including highlights, grays, roots), style, length, parting, volume
- EXACT hair texture (straight/wavy/curly/coily)
- EXACT hairline shape
- If facial hair exists (beard/mustache/stubble/goatee): reproduce its EXACT style, density, length, color, and grooming pattern
- Ensure the hair interacts realistically with the warm studio lighting

**NOSE** — Core identity marker:
- EXACT bridge width, height, curvature, nostril shape, and tip shape

**LIPS & MOUTH**:
- EXACT lip shape, thickness ratio (upper vs lower), width, and natural color
- EXACT mouth openness and teeth visibility (if showing teeth, show the same amount)

**FACE STRUCTURE**:
- EXACT face shape (oval/round/square/heart/oblong)
- EXACT jawline, chin, cheekbone structure, and forehead proportions

**EXPRESSION** — DO NOT ALTER:
- Keep the EXACT same expression from Image 1
- Do NOT make them smile if they aren't smiling
- Preserve mouth position, eye squint, eyebrow raise, and head tilt angle exactly

**ACCESSORIES & CLOTHING**:
- Preserve ALL accessories exactly: glasses (frame shape, color, lens), earrings, nose rings, bindi, cap, headband
- Keep the EXACT same clothing (color, pattern, neckline). Apply the warm scene lighting to the clothing too.

=== SUBTLE portrait retoucHING ===
Apply tasteful enhancements — like a high-end portrait photographer's post-processing:

✅ ALLOWED:
- Slightly smoother skin texture, reduction of minor temporary blemishes (pimples)
- Slightly brighter eyes to feel "alive" in the studio lighting
- Overall professional color grading to unify with the party theme

🚫 STRICTLY FORBIDDEN:
- DO NOT change the person's core skin color (brown must remain brown, but it should be "warm brown" to match the scene). Do NOT lighten or bleech the skin.
- DO NOT change face structure or identity features.
- DO NOT add makeup or forced smiles.

=== OUTPUT ===
A single cohesive, high-resolution final group selfie. No split screens, no text overlays, no borders. The person must look like they are physically present, standing 1:1 next to the leaders, sharing the same light and space. Any "floating" or "cut-and-paste" appearance is an absolute failure.`;

  const payload = {
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: selfieMimeType, data: selfieBase64 } },
        { inlineData: { mimeType: cachedBaseForAI!.mimeType, data: cachedBaseForAI!.base64 } }
      ]
    }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      temperature: 0.2, // Slight creative room for the subtle beautification
    }
  };

  let maxRetries = 3;
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
        const retryInfo = errorData.error?.details?.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
        let delayMs = 6000; // Default wait 6 seconds
        if (retryInfo && retryInfo.retryDelay) {
          const seconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
          if (!isNaN(seconds)) delayMs = (seconds * 1000) + 1000; // Add 1s buffer
        }

        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Rate limit exceeded multiple times. Final wait was ${Math.round(delayMs / 1000)}s.`);
        }

        console.warn(`[CAMPAIGN AI] 429 Rate limit hit. Retrying in ${Math.round(delayMs / 1000)}s... (Retry ${retries}/${maxRetries})`);
        await delay(delayMs);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", response.status, errorText);
        throw new Error(`Gemini API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const imgPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imgPart?.inlineData?.data) {
        return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
      }

      console.warn("No image data found in Nano Banana response. Parts:", data.candidates?.[0]?.content?.parts?.length);
      return null;

    } catch (e: any) {
      if (e.name === "AbortError" || e.message?.includes("fetch")) {
        console.warn(`Network error, retrying... (Retry ${retries + 1}/${maxRetries})`);
        retries++;
        if (retries >= maxRetries) throw new Error("Network request failed after multiple retries.");
        await delay(3000);
        continue;
      }
      console.error("Nano Banana generation failed:", e);
      throw e; // Bubble it up to trigger the explicit error handling
    }
  }
  return null;
}

/**
 * Enhanced Local Composite Fallback
 * Optimized for Right-Side positioning with smooth radial blending.
 */
async function generatePremiumLocalComposite(selfieBase64: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas Error");

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  };

  const [baseImg, userImg] = await Promise.all([
    cachedBaseForCanvas ? Promise.resolve(cachedBaseForCanvas) : loadImage(IMAGES.campaignBase).then(i => { cachedBaseForCanvas = i; return i; }),
    loadImage(`data:image/jpeg;base64,${selfieBase64}`),
  ]);

  // 1. Draw Template Background
  ctx.drawImage(baseImg, 0, 0, 1080, 1080);

  // 2. Setup User Layer (Positioned on the FAR Right)
  const targetW = 480;
  const targetH = 1000;
  const targetX = 600;
  const targetY = 120;

  const layer = document.createElement("canvas");
  layer.width = targetW;
  layer.height = targetH;
  const lctx = layer.getContext("2d")!;

  // Draw user with aspect-aware crop
  const aspect = userImg.width / userImg.height;
  let sW = userImg.width, sH = userImg.height, sX = 0, sY = 0;
  if (aspect > (targetW / targetH)) {
    sW = userImg.height * (targetW / targetH);
    sX = (userImg.width - sW) / 2;
  } else {
    sH = userImg.width * (targetH / targetW);
    sY = (userImg.height - sH) / 2;
  }
  lctx.drawImage(userImg, sX, sY, sW, sH, 0, 0, targetW, targetH);

  // 3. Natural Blending (Masking)
  lctx.globalCompositeOperation = 'destination-in';
  const grad = lctx.createRadialGradient(targetW * 0.5, targetH * 0.45, 100, targetW * 0.5, targetH * 0.5, 600);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.95)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = grad;
  lctx.fillRect(0, 0, targetW, targetH);

  const fadeGrad = lctx.createLinearGradient(0, 0, 120, 0);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, 'rgba(0,0,0,1)');
  lctx.fillStyle = fadeGrad;
  lctx.fillRect(0, 0, 120, targetH);

  // 4. Draw User with Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = -20;
  ctx.drawImage(layer, targetX, targetY);
  ctx.restore();

  // 5. Global Party Colors Overlay (Unifies the scene with Red/Yellow theme)
  const overlay = document.createElement("canvas");
  overlay.width = 1080;
  overlay.height = 1080;
  const octx = overlay.getContext("2d")!;

  // Creates a vivid Red & Yellow party themed vignette/gradient
  const partyGrad = octx.createRadialGradient(540, 500, 200, 540, 540, 1080);
  partyGrad.addColorStop(0, "rgba(245, 168, 0, 0.15)"); // Vivid Yellow center
  partyGrad.addColorStop(0.7, "rgba(200, 16, 46, 0.12)"); // Sharp Red transition
  partyGrad.addColorStop(1, "rgba(160, 13, 36, 0.25)");  // Deep Red outer
  octx.fillStyle = partyGrad;
  octx.fillRect(0, 0, 1080, 1080);

  ctx.globalCompositeOperation = "hard-light";
  ctx.globalAlpha = 0.55; // Increased prominence of party colors
  ctx.drawImage(overlay, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  // 6. Branding Banner (Modernized with Red and Yellow Logo Colors)
  // Party Red: #C8102E, Party Yellow: #F5A800
  ctx.fillStyle = "#C8102E"; // Party Red base
  ctx.fillRect(0, 1000, 1080, 80);

  // Add a yellow top strip to the banner
  ctx.fillStyle = "#F5A800";
  ctx.fillRect(0, 1000, 1080, 4);

  ctx.font = "800 32px Lexend, sans-serif";
  ctx.fillStyle = "#F5A800"; // Yellow text on Red banner
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText(`${CANDIDATE_NAME_TAMIL} | ${PARTY_ACRONYM} 2026`, 540, 1052);


  return canvas.toDataURL("image/jpeg", 0.95);
}
