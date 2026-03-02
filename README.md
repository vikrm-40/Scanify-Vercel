# Scanify 🔍

AI-powered text extraction from screenshots and images. Upload any image — news chyrons, subtitles, scoreboard graphics, documents, screenshots — and extract every word instantly using Claude Vision.

**Live demo:** deploy in 5 minutes for free on Vercel.

---

## Features

- **OCR via Claude Vision** — extract all text from any image
- **Confidence heatmap** — uncertain words highlighted in amber
- **3 ways to load an image** — paste from clipboard, URL, or file upload
- **Android-friendly** — long-press the textarea to paste on mobile
- **History sidebar** — last 20 scans saved locally, restored with one click
- **Dark lab UI** — Geist Mono, electric cyan accents, scan animations
- **Zero tracking** — no analytics, no cookies, API key never leaves the server

---

## Deploy to Vercel (5 minutes)

### 1. Get an Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in → **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`) — save it somewhere safe

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — Scanify"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scanify.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New → Project**
3. Select your `scanify` repository → click **Import**
4. Leave all settings as default → click **Deploy**
5. Wait ~30 seconds for the first deploy

### 4. Add your API Key ⚠️ (required!)
1. In your Vercel project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-...` key
   - **Environments:** ✅ Production  ✅ Preview  ✅ Development
3. Click **Save**
4. Go to **Deployments** → click ⋯ on the latest deploy → **Redeploy**

### 5. Open your app 🎉
Vercel gives you a URL like `https://scanify-yourname.vercel.app`
- Bookmark it on your phone
- Share it with anyone — no login required

---

## Project Structure

```
scanify/
├── api/
│   ├── ocr.js          ← Serverless: OCR extraction via Claude Vision
│   └── heatmap.js      ← Serverless: Confidence heatmap analysis
├── public/
│   └── index.html      ← Full single-page frontend app
├── .gitignore
├── package.json
├── vercel.json         ← Routing + function config
└── README.md
```

### How it works

```
User uploads image
       ↓
Browser → POST /api/ocr  (image as base64)
       ↓
Vercel server reads ANTHROPIC_API_KEY (never exposed to browser)
       ↓
Anthropic Claude Vision API → extracts all text
       ↓
/api/ocr returns { text: "..." } to browser
       ↓
Browser → POST /api/heatmap (image + OCR text)
       ↓
Claude identifies uncertain words → returns { uncertain: [...] }
       ↓
Browser highlights uncertain words in amber
```

The API key is **only ever used on the server** — it is never sent to the browser or included in any client-side code.

---

## Using on Android (Redmi / MIUI)

File pickers are blocked inside the Claude Android app's WebView sandbox. Use the **Paste tab** instead:

1. Take a screenshot of the text you want to scan
2. Open **Gallery** → find the screenshot → tap **Share** → **Copy image**
3. Return to Scanify → **long-press the textarea** → tap **Paste**
4. The image loads automatically and OCR runs

The textarea has `-webkit-user-select: auto` which enables the long-press paste menu on all Android WebViews including MIUI.

---

## Local Development

```bash
npm install -g vercel
vercel dev
```

Then open `http://localhost:3000`.

Set your API key for local dev:
```bash
# Create a .env.local file (gitignored)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key from console.anthropic.com |

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS, Geist Mono font
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) via Vision API
- **Hosting:** Vercel (free tier works fine)
- **Storage:** localStorage only (scan history, client-side)

---

## License

MIT
