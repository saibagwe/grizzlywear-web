/**
 * SEED SCRIPT — Run this ONCE to migrate existing mock products to Firestore.
 * 
 * Usage (from project root):
 *   node scripts/seed-products.mjs
 * 
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your Firebase service account JSON
 *   - OR run: firebase login && firebase use grizzlywear
 *   - Install: npm install firebase-admin (globally or in a temp dir)
 * 
 * Alternatively, use the Admin Panel at /admin/products/new to add products manually.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
// Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const MOCK_PRODUCTS = [
  {
    name: 'Grizzly Originals',
    slug: 'grizzly-originals',
    category: 'men',
    subcategory: 'hoodies',
    price: 3499,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161576/CSWM_Black2_yic9aq.jpg',
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161710/CSWM_Black_4_ddjw6k.jpg',
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161710/CSWM_navy2_yedhi2.jpg'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Onyx Black', hex: '#111111' }],
    description: 'The definitive heavyweight hoodie. Crafted from 450gsm premium French terry cotton. Features an extreme drop shoulder, cropped body, and oversized hood for the perfect boxy silhouette. Pre-shrunk and garment dyed for a vintage wash effect.',
    shortDescription: 'Heavyweight 450gsm oversized fit hoodie.',
    material: '100% Premium French Terry Cotton (450gsm)',
    fit: 'Oversized / Boxy fit, true to size',
    careInstructions: ['Machine wash cold', 'Wash with similar colours', 'Do not tumble dry', 'Iron on reverse'],
    features: ['Double-stitched hem', 'Drop shoulder design', 'Unlined oversized hood'],
    rating: 4.8,
    reviewCount: 124,
    isNew: false,
    isFeatured: true,
    inStock: true,
    stock: 50,
    tags: ['heavyweight', 'essential', 'hoodie'],
  },
  {
    name: 'Essential Cargo Pants',
    slug: 'essential-cargo-pants',
    category: 'men',
    subcategory: 'joggers',
    price: 4299,
    comparePrice: 4999,
    discount: 14,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773162813/2150264165_yifszk.jpg',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Olive', hex: '#4B5320' }],
    description: 'Tactical functionality meets street aesthetics. Made from durable ripstop cotton blend.',
    shortDescription: 'Durable ripstop cargo pants with adjustable taper.',
    material: '97% Cotton, 3% Elastane Ripstop',
    fit: 'Relaxed straight fit',
    careInstructions: ['Machine wash cold'],
    features: ['6 utility pockets', 'Adjustable ankle toggles'],
    rating: 4.6,
    reviewCount: 89,
    isNew: false,
    isFeatured: true,
    inStock: true,
    stock: 30,
    tags: ['utility', 'cargo', 'bottoms'],
  },
  {
    name: 'Parachute Skirt',
    slug: 'parachute-skirt',
    category: 'women',
    subcategory: 'wide-leg pants',
    price: 2899,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161555/571011290_17952121209015189_3483500787661898313_n_twjmm4.jpg',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Charcoal', hex: '#36454F' }],
    description: 'A utilitarian take on the maxi skirt. Made from crisp parachute poplin.',
    shortDescription: 'Crisp poplin maxi parachute skirt with toggles.',
    material: '100% Cotton Poplin',
    fit: 'Voluminous maxi length',
    careInstructions: ['Dry clean recommended'],
    features: ['Toggle waist', 'Side seam pockets'],
    rating: 4.6,
    reviewCount: 52,
    isNew: true,
    isFeatured: true,
    inStock: true,
    stock: 25,
    tags: ['skirt', 'utility', 'parachute'],
  },
  {
    name: 'Heavy Canvas Tote',
    slug: 'heavy-canvas-tote',
    category: 'accessories',
    subcategory: 'bags',
    price: 1299,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773163439/Screenshot_from_2026-03-10_22-53-40_gqlzgh.png',
    ],
    sizes: ['OS'],
    colors: [{ name: 'Natural', hex: '#F5F5DC' }],
    description: 'An oversized everyday tote bag made from 16oz cotton canvas.',
    shortDescription: 'Oversized 16oz heavy canvas everyday tote bag.',
    material: '100% Cotton Canvas (16oz)',
    fit: 'W: 20" x H: 15" x D: 6"',
    careInstructions: ['Spot clean only'],
    features: ['Internal zip pocket', 'Reinforced base'],
    rating: 4.9,
    reviewCount: 155,
    isNew: true,
    isFeatured: false,
    inStock: true,
    stock: 100,
    tags: ['bag', 'tote', 'utility'],
  },
];

async function seed() {
  console.log('🌱 Seeding Firestore products collection...\n');
  
  for (const product of MOCK_PRODUCTS) {
    try {
      const docRef = await db.collection('products').add({
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`✅ Added: ${product.name} (${docRef.id})`);
    } catch (err) {
      console.error(`❌ Failed to add ${product.name}:`, err);
    }
  }
  
  console.log('\n🎉 Seed complete! Visit /admin/products to see your products.');
  process.exit(0);
}

seed();
