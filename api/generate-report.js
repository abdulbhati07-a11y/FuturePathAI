export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, category, answers, context } = req.body;
  const apiKey = process.env.OPENCODEZEN_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenCodeZen API Key' });
  }

  const prompt = `
  You are an expert financial and career advisor for FuturePath AI.

  Simulation Title: ${title || 'Simulation'}
  Category: ${category || 'PERSONAL'}
  User Answers/Context: ${JSON.stringify(answers || {})}

  Analyze the user's situation based on the provided context, referencing real-world studies, statistics, or general economic/industry proofs where applicable.
  When generating salary or financial figures, ALWAYS use USD (e.g. +$20k) and not Euros or other currencies.
  You MUST return ONLY a raw JSON object (without markdown blocks like \`\`\`json) with the exact following structure:
  {
    "bestCase": { "label": "BEST CASE", "probability": 25, "title": "<short title>", "description": "<detailed description>", "salaryDelta": "<e.g. +$20k or N/A>", "satisfaction": "<e.g. 9/10>" },
    "mostLikely": { "label": "MOST LIKELY", "probability": 60, "title": "...", "description": "...", "salaryDelta": "...", "satisfaction": "..." },
    "worstCase": { "label": "WORST CASE", "probability": 15, "title": "...", "description": "...", "salaryDelta": "...", "satisfaction": "..." },
    "rightReasons": [ "<reason 1>", "<reason 2>", "<reason 3>" ],
    "wrongReasons": [ "<reason 1>", "<reason 2>", "<reason 3>" ],
    "timeline": [
      { "id": "t1", "label": "TODAY", "sublabel": "<action>" },
      { "id": "t2", "label": "MONTH 3", "sublabel": "<milestone>" },
      { "id": "t3", "label": "YEAR 1", "sublabel": "<milestone>" }
    ],
    "alternatives": [
      { "id": "alt1", "title": "<alt 1>", "subtitle": "<brief desc>", "score": 85 }
    ]
  }`;

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
          { role: 'system', content: 'You are a decisive financial and decision-making AI advisor for FuturePath AI. Always return exact JSON structure requested.' },
          { role: 'user', content: prompt }
        ],
        reasoning_effort: 'none',
        temperature: 0.4,
      })
    });

    if (!apiRes.ok) {
      throw new Error(`OpenCodeZen API error: ${apiRes.statusText}`);
    }

    const data = await apiRes.json();
    let content = data.choices[0]?.message?.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '');
    
    return res.status(200).json(JSON.parse(content));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}
