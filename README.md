# ContextOS — Setup Guide

A complete step-by-step guide to get ContextOS running from zero.

---

## Prerequisites

Install these first if you haven't:
- **Node.js 18+**: https://nodejs.org
- **Git**: https://git.scm.com (optional but recommended)

---

## Step 1: Create the project folder

Open your terminal (Mac: Terminal app / Windows: PowerShell) and run:

```bash
mkdir contextos
cd contextos
```

---

## Step 2: Copy all the files

Place each file from this bundle into your `contextos/` folder following the exact paths shown. Your folder structure should look like this when done:

```
contextos/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── unauthorized/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       └── chat/
│           └── route.ts
├── components/
│   ├── SessionProvider.tsx
│   ├── Sidebar.tsx
│   ├── ChatPanel.tsx
│   └── PDFViewer.tsx
├── lib/
│   ├── utils.ts
│   └── documents.ts
├── public/
│   └── docs/          ← put your demo PDFs here
├── middleware.ts
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── .env.local          ← you create this (see Step 3)
```

---

## Step 3: Set up environment variables

1. Copy `.env.local.example` to a new file called `.env.local`
2. Fill in the values:

```env
GEMINI_API_KEY=          # From https://aistudio.google.com/app/apikey
NEXTAUTH_SECRET=         # Run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=        # From Google Cloud Console
GOOGLE_CLIENT_SECRET=    # From Google Cloud Console
ALLOWED_EMAIL_DOMAIN=firmdomain.com   # Change this to your actual domain
```

### Getting your Gemini API Key:
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy it into `GEMINI_API_KEY`

### Getting Google OAuth credentials:
1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services → OAuth consent screen** → configure it (External, add your email as test user)
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Secret into your `.env.local`

### Generating NEXTAUTH_SECRET:
Run this in your terminal:
```bash
openssl rand -base64 32
```
Copy the output into `NEXTAUTH_SECRET`.

---

## Step 4: Add demo PDFs

Place any PDF file into `/public/docs/`. For the demo, both documents in `lib/documents.ts` point to `/docs/sample.pdf`, so you need at least one PDF there. Rename it to `sample.pdf`.

You can download any open PDF from the internet for testing. The AI will use the pre-extracted text in `lib/documents.ts`, not the visual PDF content, so any PDF works for the demo.

---

## Step 5: Install dependencies

In your terminal (inside the `contextos/` folder):

```bash
npm install
```

This installs all packages from `package.json`. It may take 1–2 minutes.

---

## Step 6: Run the app

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You'll be redirected to sign in with Google. Use an account that matches your `ALLOWED_EMAIL_DOMAIN`.

---

## Step 7: Test the magic ✨

1. Click a document in the left sidebar (e.g., "Meridian Pharma IPO Report")
2. The PDF appears on the right, the chat is ready on the left
3. Type: **"What is the EBITDA margin?"**
4. The AI responds with the answer and a `↗ Page 3` citation button
5. Click the citation — the PDF viewer jumps to page 3 with a gold highlight!

---

## Deploying to Vercel

1. Push your code to a GitHub repository (make sure `.env.local` is in `.gitignore`!)
2. Go to https://vercel.com → Import your repository
3. Add all environment variables from `.env.local` in Vercel's dashboard
4. Change `NEXTAUTH_URL` to your Vercel deployment URL (e.g., `https://contextos.vercel.app`)
5. In Google Cloud Console, add your Vercel URL to the authorized redirect URIs:
   `https://your-app.vercel.app/api/auth/callback/google`
6. Deploy!!

---

## Adding your own real documents

1. Place your PDF in `/public/docs/your-document.pdf`
2. Extract the text (use Acrobat Reader's "Export to Text" feature, or any PDF reader)
3. Open `lib/documents.ts`
4. Add a new entry to the `DEMO_DOCUMENTS` array following the existing pattern
5. Mark each page with `--- PAGE N ---` at the start of that page's content

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "GEMINI_API_KEY not found" | Check `.env.local` exists and has the correct key |
| PDF viewer is blank | Make sure your PDF is in `/public/docs/` and the path in `lib/documents.ts` matches |
| Sign-in fails | Verify your Google Cloud OAuth redirect URI includes `http://localhost:3000/api/auth/callback/google` |
| "Access Restricted" page | Your Google account email doesn't match `ALLOWED_EMAIL_DOMAIN` in `.env.local` |
| Citations don't jump | The AI response must contain `[Page N]` format. Check the system prompt in `app/api/chat/route.ts` |
