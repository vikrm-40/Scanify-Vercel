// api/heatmap.js
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function — Confidence Heatmap Analysis
//
// Takes the same image + the OCR text, asks Claude which words it was
// least confident about (blur, low-res, unusual fonts, etc.).
// Returns a JSON array of uncertain word strings.
//
// ENVIRONMENT VARIABLE REQUIRED:
//   ANTHROPIC_API_KEY — same key as used by api/ocr.js
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Use POST' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server.' });
  }

  try {
    const { imageBase64, imageType, ocrText } = req.body;

    if (!imageBase64 || !imageType || !ocrText) {
      return res.status(400).json({ error: 'Missing imageBase64, imageType, or ocrText' });
    }

    if (ocrText === '(no text detected)' || ocrText.trim().length < 10) {
      return res.status(200).json({ uncertain: [] });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageType, data: imageBase64 }
            },
            {
              type: 'text',
              text: `I ran OCR on this image and got this text:
---
${ocrText}
---
Which specific words or short phrases from this OCR result are you LEAST confident about — meaning they could be misread due to blur, low resolution, unusual fonts, partial occlusion, or compression artifacts?

Reply with ONLY a JSON array of the uncertain word strings, exactly as they appear in the OCR text above. Maximum 10 items. If you are confident about everything, reply with an empty array [].

Example: ["BREAKING", "LIVE", "24°C"]`
            }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      // Heatmap failing is non-fatal — return empty uncertain list
      return res.status(200).json({ uncertain: [] });
    }

    const data = await anthropicRes.json();
    const raw  = data.content?.map(b => b.text || '').join('').trim() || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    const uncertain = match ? JSON.parse(match[0]) : [];
    return res.status(200).json({ uncertain });

  } catch (err) {
    console.error('Heatmap handler error:', err);
    // Non-fatal — return empty
    return res.status(200).json({ uncertain: [] });
  }
}
