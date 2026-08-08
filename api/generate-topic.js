export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { message } = req.body;
  const apiKey = process.env.OPENCODEZEN_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Missing OpenCodeZen API Key' });

  try {
    const apiRes = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash-free',
        messages: [
          { role: 'system', content: 'You are an AI that categorizes user prompts into a structured title and category. Always output raw JSON: {"title":"...","category":"..."}' },
          { role: 'user', content: `Prompt: ${message}` }
        ],
        temperature: 0.2,
      })
    });

    const data = await apiRes.json();
    let content = data.choices[0]?.message?.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '');
    
    return res.status(200).json(JSON.parse(content));
  } catch (err) {
    return res.status(200).json({ title: "Custom Simulation", category: "PERSONAL" });
  }
}
