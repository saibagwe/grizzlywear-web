# Contributors Analysis

I have analyzed the repository's commit history to provide a comprehensive, commit-by-commit breakdown for each contributor, followed by a summary of their respective roles in the project.

## Detailed Commit Analysis by Author

### 1. Siddhesh Achrekar (S1ddheshh)
Siddhesh laid the foundation for both the frontend and the AI-powered backend, pushing a substantial amount of the core functionality.

*   **f9c0c6e & a803ad5 (0.1 / Add initial README):** Initialized the repository by adding basic `.gitignore` and `README.md` files.
*   **6fb83c0 (0.1):** Set up the foundational scaffolding for the monorepo, adding `apps/web` (Next.js), `backend` (Express.js), and `apps/ai-service` (Python). Added critical UI components (Navbar, Footer, layout), initial routing (auth, admin, shop, cart, checkout), and established the core structure for the auth/cart Zustand stores.
*   **d4e58d2 (0.2):** Massively expanded the web app's functionality. Added comprehensive mock data (`mock-data.ts`), developed the `AIChatWidget` and its wrapper, overhauled the layout/footer/navbar, and built out the frontend pages for the shop, account, cart, checkout, tracking, and the admin dashboard.
*   **8a8a9ed (0.3):** Built out informational pages (About, Careers, Contact, FAQ, Press, Returns Policy, Size Guide, Support). Expanded the Account section (Addresses, Wishlist) and significantly improved the `AIChatWidget` and `SearchOverlay`. Added an `addressStore`.
*   **3ad0afb (0.31):** Focused on authentication and user management. Expanded `authStore`, refactored Login/Register pages, and implemented `userService.ts` for Firestore integration. Added `CategoryHeader` for the shop.
*   **e2c89f3 (0.4 razorpay):** Integrated Razorpay for payments. Added `razorpayService.ts`, updated checkout and cart pages to support payment processing, and added a robust order confirmation page.
*   **6e5a0e3 (0.41 logo):** Uploaded the project logo (`logo1.png`) and updated the homepage and Navbar to reflect the new branding.
*   **62cb214 (0.42):** Made minor UI refinements and adjustments to the homepage.
*   **b7fac73 (0.43):** Tweaked the mock data repository to refine product representations.
*   **1afc988 (0.5):** Refined checkout and order confirmation pages, adjusted Navbar UI, updated Razorpay service logic, and implemented critical Firestore security rules.
*   **93f184e (0.51):** Migrated Next.js configuration from `next.config.js` to `next.config.mjs` for better module compatibility.
*   **28d6afc (0.92):** Massive update to the Python `ai-service`. Added Pinecone service, Gemini service, Firebase client, and an ingest script to vectorize products. Substantially updated the `AIChatWidget` on the frontend to communicate with the new AI backend.
*   **c2489c1 & fff5b6c (0.93 & 0.94):** Added a suite of Python test scripts (`test_ai.py`, `test_gemini.py`, `test_full_rag.py`, `test_orig_embed.py`) to validate the Gemini and Pinecone RAG integrations.
*   **21f6fb0 (0.95):** Minor config fix in `ai-service/main.py`.
*   **f5134c4 (0.5):** Advanced AI integration. Updated Gemini service, enhanced `ingest_products.py`, added an API route for visual search, created `index-products.mjs` script in the web app to sync products with Pinecone, and added product fetching to Firestore services.
*   **a03365b (fix chat embedding dimension):** Fixed vector embedding dimension issues within `gemini_service.py` to ensure compatibility with Pinecone vector indices.
*   **1820092 (2.51):** Introduced visual search logic in the `ai-service` via `visual_search_service.py` and updated the web API route.
*   **cca0f14 (Revert "2.51"):** Temporarily reverted the visual search backend logic and requirements.
*   **8511641 (2.6):** Refactored and simplified `gemini_service.py` and `main.py` in the AI service, along with updates to the frontend `AIChatWidget`.
*   **7851c8b & 14fd3b1 (2.6 & 2.61):** Major revamp of the homepage (`page.tsx`) to improve user experience and layout.
*   **180a782 to 23c6961 (2.01 to 2.2 final):** A series of rapid commits addressing minor package dependency updates, Vercel deployment configurations (`vercel.json`), and lockfile synchronizations.
*   **fe880e0 & f641637 (2.3 visual search & 2.31):** Adjusted Next.js configuration to support visual search assets and dependencies.
*   **abdbb8a, 28752fa & 5e99d21 (2.92 & fix chat payload):** Final refinements to the `AIChatWidget` UI, and payload/config fixes in `gemini_service.py` and `main.py` to ensure stable chatbot responses.
*   **68af3a3:** Merged changes from the main branch.

### 2. Sunnyy Kadam
Sunnyy focused heavily on building the administrative backend, database architecture (Firestore), Firebase serverless functions, and complex frontend state management.

*   **a210c42 (0.6):** Built out the foundational Admin Panel. Added product management pages (list, create/edit), adjusted shop routing, set up the initial `productService.ts` for Firestore, and wrote a product seeding script (`seed-products.mjs`). Updated Firebase/Firestore rules.
*   **b9f87e8 (0.61):** Refined the "New Product" admin page and pruned unnecessary logic from `productService.ts`.
*   **75b1af1 (0.7):** Major expansion of the admin dashboard and order management. Created dynamic routes for viewing/editing specific orders, implemented `orderService.ts`, and added a script to assign admin roles (`set-admin-role.mjs`).
*   **ec51262 (0.71):** Enhanced the user tracking page (`track/page.tsx`) and updated order fetching logic.
*   **b9d33c4 (0.8):** Implemented the Support/Ticketing system. Added frontend admin pages for viewing and managing tickets, created `ticketService.ts`, and updated the user account page.
*   **d41a2dc & 6f8d13c (0.81 & 0.83):** Developed the Customer Management section of the admin panel. Added list and detail views for customers, heavily refactored products/orders/tickets admin pages, and temporarily added inventory services.
*   **4f04a6a (0.82):** Improved the layout of the admin panel, updated login flows, authStore, and Next.js middleware for route protection.
*   **c67e085 (0.9):** Massive UI/UX and feature overhaul across the entire admin panel. Added the Analytics page, built out the Reviews admin page, updated `reviewService.ts`, and polished all table/list views.
*   **dc80f74 (0.91):** Polished global CSS, optimized order detail fetching, refined order list UI, and significantly tightened Firestore security rules.
*   **28d6afc to 500a02c (0.94 & 0.96):** Stripped out hardcoded mock data in favor of real database integration. Enhanced the checkout flow, updated the analytics dashboard with real metrics, added notification services, and created/updated Firebase Cloud Functions (`functions/package.json`).
*   **478b8c1 (0.97):** Deployed a large suite of Firebase Cloud Functions (`functions/src/index.ts`) for backend triggers, webhook handling, and secure operations, heavily updating lockfiles.
*   **42870a6 (0.98):** Cleaned up deprecated inventory service code.
*   **917fbca (0.99):** Finalized the Reviews system. Updated the product detail page to fetch real reviews, expanded the admin reviews dashboard, and added cloud functions for review aggregation.
*   **f22c7e9 (1.0):** Minor typo fix in the shop slug page.
*   **429c81a (1.1):** Enormous refactor of Firebase Cloud Functions (350+ lines). Revamped the admin layout sidebar, optimized Firestore indexes/rules, and tied together services (tickets, notifications, orders).
*   **68bea4f (1.2):** Built the complete Inventory Management system. Added an advanced admin page, `EditStockModal`, `StockHistoryDrawer`, `AlertBanners`, and a custom `useInventory` hook for state management.
*   **df5efda & b687133 (1.3 & 1.4):** Solidified the E-commerce flow. Overhauled the Cart and Checkout pages, ensuring tight synchronization with `cartStore` and `orderService`, and updated shop logic.
*   **e1bd59a, 3a0cf45 & 6978ee3 (1.5, 1.6 & 1.7):** Iterative, deep enhancements to the Admin Analytics page, introducing complex charting and data aggregation logic, and refining the admin layout.
*   **b19de28 (2.0):** Package manager and lockfile synchronizations.
*   **c5fa9e1 (2.9):** Minor formatting update to `README.md`.
*   **a39434c (2.91-review):** Overhauled the product detail page (`shop/[slug]/page.tsx`) to display an advanced, interactive review section, and updated `reviewService.ts` and Firestore indexes to support complex review queries.

### 3. subhodipmathur
Subhodip specialized in integrating cutting-edge machine learning capabilities (Computer Vision and AI) directly into the web application.

*   **75894a6 & c3c2875 (1.8 & 1.8.1):** Developed the **Virtual Try-On** feature. Created a complex UI component (`TryOnModal.tsx`), integrated it into the product page, and established the backend API route (`api/tryon/route.ts`) to handle the image processing requests.
*   **44aafb8 (1.9):** Implemented on-device **Visual Search**. Directly embedded the `Xenova/clip-vit-base-patch32` ONNX machine learning model into the repository for edge inference. Created a dedicated visual search page (`visual-search/page.tsx`), a corresponding API route, and a script to index products based on visual embeddings.
*   **2efe687 (1.9.1):** Updated `vercel.json` to ensure the heavy ML models and WASM files were correctly bundled during Vercel deployment.
*   **ace66d1 (2.8-size recommendation):** Developed an intelligent **Size Recommendation System**. Wrote algorithmic logic (`sizeRecommendation.ts`), built an interactive modal (`SizeAdvisorModal.tsx`), and integrated user sizing profiles into `userService.ts` to provide personalized fit advice on product pages.
*   **404f56f & f89c8bc (README UPDATED):** Expanded the repository's `README.md` to thoroughly document the project, environment variables, features, and deployment instructions.

### 4. Sai Bagwe
Sai focused on finalizing critical e-commerce and post-purchase functionalities, ensuring a complete user journey.

*   **88ba7d6 (2.7-order history):** Implemented the Order History view within the user's Account dashboard, allowing users to view past purchases seamlessly.
*   **1096013 (2.71-fixed categories):** Debugged and fixed category navigation issues. Refactored hardcoded category headers and updated the shop and home pages to render categories correctly.
*   **06e07ed & c55531f (2.71-invoice & 2.711-final invoice):** Developed the comprehensive Invoice Generation system. Created `invoiceService.ts` to dynamically generate PDF receipts, integrated invoice downloading into the order confirmation page, and added it to the user account history.
*   **f99fe37 (readme):** Minor documentation tweak.

---

## Summary of Roles

*   **Siddhesh Achrekar (Architect / Full-Stack & AI Engineer):** The initiator of the project. Siddhesh scaffolded the monorepo, built the foundational React/Next.js UI, and established the core e-commerce states (cart, auth, checkout) and payment gateway (Razorpay). Most notably, he single-handedly engineered the `ai-service` backend, utilizing Pinecone and Gemini to build a Retrieval-Augmented Generation (RAG) chatbot and product ingestion pipeline.
*   **Sunnyy Kadam (Lead Backend & Admin Panel Engineer):** The backbone of the platform's operations. Sunnyy architected the entire administrative suite (dashboard, inventory, analytics, customer management, ticketing) and managed the complex data layer. He wrote the Firebase Cloud Functions for server-side logic, architected the Firestore database schemas and security rules, and ensured the e-commerce checkout flow synced securely with the database.
*   **subhodipmathur (Machine Learning / Advanced Features Engineer):** The innovator of the team. Subhodip brought cutting-edge AI features to the frontend, successfully implementing on-device Visual Search using Transformers.js (ONNX models), an AI-driven Size Recommendation engine, and an interactive Virtual Try-On API/Modal, elevating the app from a standard store to an advanced tech showcase.
*   **Sai Bagwe (E-Commerce UX Contributor):** The post-purchase specialist. Sai polished the user journey by finalizing critical components like dynamic PDF Invoice generation, ensuring order histories were cleanly accessible in user profiles, and debugging category navigation elements across the site.
