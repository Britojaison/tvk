import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { selfieBase64, selfieMimeType } = await req.json();

        if (!selfieBase64 || !selfieMimeType) {
            return NextResponse.json({ error: "Missing image data" }, { status: 400 });
        }

        const baseUrl = req.headers.get("origin");

        // Randomly select one of the 4 candidates
        const candidateNumber = Math.floor(Math.random() * 4) + 1; // 1-4
        const candidateImagePath = `/candidate${candidateNumber}.jpg`;

        // Fetch Vijay's image
        const vijayResp = await fetch(`${baseUrl}/vijay.avif`);
        const vijayBlob = await vijayResp.blob();
        const vijayBuffer = await vijayBlob.arrayBuffer();
        const vijayBase64 = Buffer.from(vijayBuffer).toString("base64");

        // Fetch the selected candidate's image
        const candidateResp = await fetch(`${baseUrl}${candidateImagePath}`);
        const candidateBlob = await candidateResp.blob();
        const candidateBuffer = await candidateBlob.arrayBuffer();
        const candidateBase64 = Buffer.from(candidateBuffer).toString("base64");

        const prompt = `Photographic clone.
Image 1: The main subject.
Image 2: The main subject (same person).
Image 3: Vijay Thalapathy.
Image 4: TVK Candidate.

Generate a close-up group selfie of Image 1, Image 3, and Image 4 standing together.
OFFICIAL BACKGROUND: The backdrop must feature only the following TVK-specific elements:
1. OFFICIAL WHISTLE SYMBOL: The party's clean, modern whistle logo. 
STRICT DUAL-COLOR RULE: The whistle must be a COMBINATION of colors. It must be either (White and Black) together OR (Red and Yellow) together. 
CRITICAL: Do NOT use a single solid color for the whistle. It MUST be a two-tone combination of these colors.
2. OFFICIAL TEXT: The word "TVK" or "TAMIZHAGA VETTRI KAZHAGAM" in bold, premium typography.
STRICT RULE: Do NOT generate ANY flags in the background. Use ONLY whistles or TVK text.
URGENT NEGATIVE CONSTRAINT: Absolutely NO cycle, NO bicycle, NO bicycle wheels, and NO spoke-based icons. The 'cycle' is an opposition party logo and is STRICTLY FORBIDDEN.
RESTRICTION: No other political party symbols or icons. Only TVK-specific content.
RESTRICTION: Absolutely NO physical phones, cameras, arms, or hands visible in the photo.
Crucial: Maintain the exact likeness, identity, and facial structure of Image 1.
Subject gaze: Image 1 is looking directly straight into the camera lens.`;


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
                                mimeType: selfieMimeType,
                                data: selfieBase64,
                            },
                        },
                        {
                            inlineData: {
                                mimeType: vijayBlob.type,
                                data: vijayBase64,
                            },
                        },
                        {
                            inlineData: {
                                mimeType: candidateBlob.type,
                                data: candidateBase64,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ["IMAGE"],
                temperature: 0, // Zero temperature for maximum face preservation
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

        const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType: string, data: string } }> } }> };
        const imgPart = data.candidates?.[0]?.content?.parts?.find(
            (p) => p.inlineData
        );

        if (!imgPart?.inlineData?.data) {
            return NextResponse.json({ error: "AI produced no image" }, { status: 500 });
        }

        return NextResponse.json({
            data: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[API_GENERATE] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
