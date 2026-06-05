# Grizzlywear Codebase Analysis

### 1. Project Overview & Architecture
**Grizzlywear** is an AI-powered fashion e-commerce platform tailored for an Indian streetwear brand. It relies on a modern, decoupled architecture designed to scale, leveraging a Monorepo strategy managed via **pnpm workspaces**. 

**Core Architecture Layers:**
*   **Web Application (`apps/web`):** Built on Next.js 14 (App Router) serving as the main interface for both end-users (storefront) and internal staff (admin dashboard). It directly interfaces with Firebase for real-time data, auth, and logic.
*   **AI Service (`apps/ai-service`):** A standalone microservice written in Python (FastAPI). It connects to Pinecone (Vector Database) and Google Gemini (LLM) to perform embedding generation, handle RAG (Retrieval-Augmented Generation) based conversational product queries, and execute batch synchronization of product metadata into vector formats.
*   **Node.js Backend (`backend`):** A supplemental Express.js server using TypeScript and MongoDB (Mongoose) designed primarily to manage specific pieces of user data synchronization and profile states outside of the core Firebase model (possibly serving as an iterative migration or legacy connector).
*   **Cloud Functions (`functions`):** Serverless logic deployed to Firebase Cloud Functions to execute sensitive or protected background logic like order post-processing, stock decrementing, ticket management, and real-time notification dispatching.

---

### 2. File Structure & Organization
The project uses the standard Monorepo layout configured in `pnpm-workspace.yaml`.

*   **`/apps/web/`** - The primary Next.js Frontend.
    *   **`src/app/`**: Next.js App Router routing. Includes `/shop` (catalogs), `/cart`, `/checkout`, `/account` (user dashboard), `/admin/*` (secured backend UI), and API routes (`/api/tryon`, `/api/visual-search`).
    *   **`src/components/`**: React functional components logically split into `ui/` (modals, chats), `admin/` (inventory panels, graphs), `shop/` (headers, filters), and `layout/` (Navbar, SmoothScrolling wrappers).
    *   **`src/hooks/`**: Custom hooks like `useAuth.ts` and `useInventory.ts`.
    *   **`src/lib/`**: Business logic, Firebase initialization (`firebase.ts`), Firestore services (`orderService`, `productService`), and Razorpay logic (`razorpayService.ts`).
    *   **`src/store/`**: Global state management managed by **Zustand** (`cartStore`, `authStore`, `checkoutStore`).
*   **`/apps/ai-service/`** - Python AI backend.
    *   `main.py`: Entrypoint for FastAPI.
    *   `pinecone_service.py` / `gemini_service.py`: LLM and Vector DB wrappers.
    *   `ingest_products.py`: Cron/script to read from Firebase and populate vector embeddings.
*   **`/backend/`** - Express API.
    *   `src/server.ts` & `src/app.ts`: Setup for Express, Cors, Helmet, Morgan.
    *   `src/controllers/userController.ts`: Handles syncing user profiles and addresses to MongoDB.
*   **`/functions/`** - Firebase Cloud Functions.
    *   `src/index.ts`: Trigger listeners (e.g., `onOrderCreated`, `onReviewWritten`).
*   **`/packages/`** - Shared utilities (though mostly scaffolded and currently light on content). Includes `config`, `types`, and `ui`.
*   **`/scripts/`** - Maintenance scripts (`seed-products.mjs` for populating the database, `set-admin-role.mjs` for setting up admin access).

---

### 3. Detailed Technology Stack
*   **Frontend Framework:** Next.js 14 (App Router), React 18
*   **Languages:** TypeScript (Primary), Python (AI Service)
*   **Styling & UI:** Tailwind CSS, `clsx`, `tailwind-merge`, `lucide-react` (Icons).
*   **Animations & 3D:** GSAP, Framer Motion, `@react-three/fiber` & `@react-three/drei` (Three.js WebGL integration), `canvas-confetti` (Checkout celebrations), Lenis (`lenis`) for smooth scrolling.
*   **State Management:** Zustand, React Query (`@tanstack/react-query`).
*   **Database & Auth:** Firebase (Authentication, Firestore Database, Cloud Functions), MongoDB (via `mongoose`).
*   **AI & Machine Learning:**
    *   **Google Gemini:** `@google/generative-ai` & `google-generativeai` (Python) for RAG Chatbot.
    *   **Local Transformers:** `@xenova/transformers` running locally inside Next.js (via ONNX runtime) executing `clip-vit-base-patch32` to process Visual Searches directly.
    *   **Virtual Try-On:** HuggingFace Spaces (`@gradio/client`) communicating with the `yisol/IDM-VTON` model.
*   **Search & Vector Stores:** Algolia (`algoliasearch`, `react-instantsearch`) for text-based product searching, Pinecone for Image/Similarity embeddings.
*   **Payments:** Razorpay Server-to-Client integration.
*   **Media Storage:** Cloudinary (`cloudinary`, `next-cloudinary`).
*   **Validation & Forms:** React Hook Form, Zod.

---

### 4. Key Features & Functionality

#### A. AI-Driven E-Commerce Features
1.  **Virtual Try-On (`/api/tryon`):**
    Users can upload a photo of themselves to see how a garment fits. The Next.js API processes the local image and garment image via Cloudinary, dispatching them via Gradio Client to a HuggingFace space (`IDM-VTON`). It streams the inferred image back to the user seamlessly.
2.  **Visual Search (`/visual-search` & `/api/visual-search`):**
    Users upload an image to find similar styles. The Next.js API intercepts the image, reshapes it using `sharp`, and extracts a local 512-dimensional CLIP embedding using `Xenova/transformers.js`. The resulting vector is cross-referenced with the Pinecone Vector Database to yield the highest cosine-similarity matches.
3.  **Conversational "Grizz" AI Chatbot (`AIChatWidget.tsx`):**
    A floating AI assistant driven by Google Gemini (`gemini-1.5-flash`). It leverages context ingested from Firestore to answer highly contextual questions regarding product specifics, fits, and return policies.
4.  **Size Advisor (`SizeAdvisorModal.tsx`):**
    Calculates dynamic size recommendations based on the user's inputted dimensions (`lib/sizeRecommendation.ts`).

#### B. Storefront & Commerce Logic
1.  **Shopping Experience:** Deep catalog integration displaying individual product slug pages with reviews, color selectors, and dynamic stock availability. 
2.  **Cart & Checkout:** Managed entirely client-side by Zustand until confirmation. Features discount code application, subtotal math, shipping overheads, and a Razorpay gateway overlay for Indian Rupee (`INR`) processing. It also gracefully handles Cash on Delivery (COD).
3.  **Payment & Security:** To prevent race conditions and maintain atomic integrity, the frontend only creates the basic order document inside Firestore. The protected decrementing of inventory numbers is locked down and executed server-side via the Firebase `onOrderCreated` Cloud Function. 

#### C. Comprehensive Admin Portal (`/admin/*`)
Access is guarded by Next.js `middleware.ts` which checks for `firebase-auth-token` and `user-role=admin` cookies.
*   **Dashboard & Analytics:** Shows macro sales, graphs generated via `recharts`, and raw metrics.
*   **Inventory Management:** Admins can alter stock numbers, view histories (`StockHistoryDrawer.tsx`), and manage low-stock alert banners.
*   **Product & Order Ops:** GUI mechanisms to mint new items directly to Firestore, process raw orders, copy Razorpay transaction/signature keys directly from the UI, and respond to Support Tickets.

#### D. Core Data & Notifications Pipeline
*   A robust `notificationService.ts` handles pushing `notifications` to Firestore.
*   Firebase Cloud Functions (`functions/src/index.ts`) intercept writes. E.g., when a user leaves a review, it triggers `onReviewWritten`; when an order is completed, `onOrderCreated` creates admin notifications, adjusts real inventory limits, and tracks historical logging.