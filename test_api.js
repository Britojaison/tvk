const apiKey = "AIzaSyCv6kz_j8rrlLylFZC_hDLTbblYoMYzwBw";

async function testKey() {
  // Test 1: Text-only with gemini-2.5-flash (should always work if key is valid)
  console.log("=== Test 1: gemini-2.5-flash (text only) ===");
  try {
    const res1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello in one word" }] }] }),
      }
    );
    const data1 = await res1.json();
    if (data1.error) {
      console.log("ERROR:", data1.error.code, "-", data1.error.message);
    } else {
      console.log("SUCCESS:", data1.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50));
    }
  } catch (e) {
    console.log("FETCH ERROR:", e.message);
  }

  // Test 2: Image generation with gemini-2.5-flash-image
  console.log("\n=== Test 2: gemini-2.5-flash-image (image gen) ===");
  try {
    const res2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Draw a simple red circle" }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );
    const data2 = await res2.json();
    if (data2.error) {
      console.log("ERROR:", data2.error.code, "-", data2.error.message);
    } else {
      const parts = data2.candidates?.[0]?.content?.parts || [];
      const hasImage = parts.some((p) => p.inlineData || p.inline_data);
      console.log("SUCCESS: Got response with", parts.length, "parts, hasImage:", hasImage);
    }
  } catch (e) {
    console.log("FETCH ERROR:", e.message);
  }
}

testKey();
