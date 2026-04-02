import {
  CANDIDATE_NAME_TAMIL,
  PARTY_ACRONYM,
  IMAGES,
} from "./constants";

let cachedBaseForCanvas: HTMLImageElement | null = null;

export async function generateCampaignPhoto(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string> {
  console.log(`[CAMPAIGN AI] Generating photo via backend API...`);

  try {
    const aiResult = await callBackendAPI(selfieBase64, selfieMimeType);
    if (aiResult) return aiResult;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CAMPAIGN AI] AI Failed:", msg);
  }

  // Fallback to local canvas-based generation if AI fails
  console.log("[CAMPAIGN AI] Falling back to local generation...");
  return generateLocalFallback(selfieBase64);
}

async function callBackendAPI(
  selfieBase64: string,
  selfieMimeType: string
): Promise<string | null> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selfieBase64, selfieMimeType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Backend API Error: ${response.status} - ${errorText}`);
    return null;
  }

  const data = await response.json();
  if (data.data) {
    return data.data;
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
