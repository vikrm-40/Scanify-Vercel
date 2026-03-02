// api/ocr.js
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function — OCR via Anthropic Claude Vision
//
// ENVIRONMENT VARIABLE REQUIRED:
//   ANTHROPIC_API_KEY — set in Vercel dashboard → Project → Settings → Env Vars
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers — allow the deployed frontend to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Use POST' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Add it in Vercel → Project Settings → Environment Variables.'
    });
  }

  try {
    const { imageBase64, imageType } = req.body;

    if (!imageBase64 || !imageType) {
      return res.status(400).json({ error: 'Missing imageBase64 or imageType' });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowed.includes(imageType)) {
      return res.status(400).json({ error: `Unsupported image type: ${imageType}` });
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
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageType, data: imageBase64 }
            },
            {
              type: 'text',
              text: `Extract ALL visible text from this image exactly as it appears on screen.

Include every piece of text you can see:
- Headlines and news chyrons (lower-third graphics)
- Names, titles, job labels
- Ticker tape or scrolling text
- Subtitles or captions burned into the frame
- On-screen graphics, scoreboards, stats panels
- Watermarks, channel branding, timestamps
- Any other text visible anywhere in the image

List the text in reading order, top to bottom and left to right.
If no text is visible anywhere, respond only with: (no text detected)
Return ONLY the extracted text — no explanations, no labels, no commentary.`
            }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      return res.status(anthropicRes.status).json({
        error: err?.error?.message || `Anthropic API error ${anthropicRes.status}`
      });
    }

    const data = await anthropicRes.json();
    const text = data.content?.map(b => b.text || '').join('') || '(no text detected)';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('OCR handler error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
