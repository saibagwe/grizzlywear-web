# Grizzlywear — AI-Powered Fashion E-Commerce Platform

> A full-stack fashion e-commerce platform built with Next.js, Firebase, and AI-driven features including visual search, virtual try-on, and size recommendations.

🌐 **Live Site:** https://grizzlywear-web-web.vercel.app/

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Cloudinary |
| Search | Algolia |
| Vector DB | Pinecone |
| AI / LLM | Google Gemini |
| Try-On | HuggingFace via Gradio Client |
| Payments | Razorpay |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0

### Installation

```bash
git clone https://github.com/your-org/grizzlywear-web.git
cd grizzlywear-web
pnpm install
```

### Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in your Firebase, Pinecone, Algolia, Razorpay, and Google AI credentials.

### Running in Development

```bash
pnpm dev        # Start all apps
pnpm dev:web    # Start web app only
```

The web app runs at **http://localhost:3000**.

---

## AI Features

- **Visual Search** — Upload an image to find visually similar products
- **Virtual Try-On** — See how a garment looks on your photo before buying
- **Size Advisor** — Get size recommendations based on your measurements
- **AI Chat Widget** — Conversational product discovery powered by Google Gemini

---

## Deployment

Deployed on **Vercel**. Set all environment variables in the Vercel project dashboard before deploying.

```bash
pnpm build:web
```
