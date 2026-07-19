const key = process.env.OPENROUTER_API_KEY || "YOUR_API_KEY_HERE";
async function test() {
  const modelsToTest = [
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3-8b-instruct:free',
    'google/gemini-pro-1.5-exp'
  ];
  for (const m of modelsToTest) {
    console.log(`Testing ${m}...`);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Test'
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
      if (res.ok) {
        console.log(`✅ ${m} works!`);
      } else {
        const err = await res.text();
        console.log(`❌ ${m} failed: ${res.status} ${err}`);
      }
    } catch(e) {
      console.log(`❌ ${m} fetch error:`, e);
    }
  }
}
test();
