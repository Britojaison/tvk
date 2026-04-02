
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Hardcoded or shared from constants if needed, but keeping it here for simplicity and security
const IMAGES = {
    campaignBase: "https://tvk-vijay.vercel.app/selfie.png", // Full URL for server-side fetch
};

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { selfieBase64, selfieMimeType } = await req.json();

        if (!selfieBase64 || !selfieMimeType) {
            return NextResponse.json({ error: "Missing image data" }, { status: 400 });
        }

        // Fetch the campaign base image from the public folder (using absolute URL or local path)
        // For simplicity on the server, we fetch it once or rely on the frontend sending it
        // but better to fetch it here to keep the total payload small from client -> server.
        const baseUrl = req.headers.get("origin");
        const campaignBaseResp = await fetch(`${baseUrl}/selfie.png`);
        const campaignBaseBlob = await campaignBaseResp.blob();
        const campaignBaseBuffer = await campaignBaseBlob.arrayBuffer();
        const campaignBaseBase64 = Buffer.from(campaignBaseBuffer).toString("base64");

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
                                mimeType: campaignBaseBlob.type,
                                data: campaignBaseBase64,
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
                temperature: 0,
            },
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Gemini API Error: ${response.status} - ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        const imgPart = data.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData
        );

        if (imgPart?.inlineData?.data) {
            return NextResponse.json({
                data: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`
            });
        }

        return NextResponse.json({ error: "AI produced no image" }, { status: 500 });

    } catch (error: any) {
        console.error("[API_GENERATE] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
