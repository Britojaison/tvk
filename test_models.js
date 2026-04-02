const k = 'AIzaSyDAaDIQkqcxDnrv30KbuyI4W1_wp77DDoU';
const fs = require('fs');
const results = [];

async function test(model) {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Draw a simple red circle' }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );
    const d = await r.json();
    if (d.error) {
      results.push(`${model}: ERROR ${d.error.code} - ${d.error.message.substring(0, 200)}`);
    } else {
      const parts = d.candidates?.[0]?.content?.parts || [];
      const hasImage = parts.some(p => p.inlineData || p.inline_data);
      results.push(`${model}: SUCCESS (parts: ${parts.length}, hasImage: ${hasImage})`);
    }
  } catch (e) {
    results.push(`${model}: FETCH ERROR - ${e.message}`);
  }
}

async function run() {
  const models = [
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview',
    'gemini-3.1-flash-lite-preview',
  ];
  for (const m of models) {
    await test(m);
  }
  fs.writeFileSync('model_results.txt', results.join('\n'));
  console.log('Done. Results saved to model_results.txt');
}

run();
