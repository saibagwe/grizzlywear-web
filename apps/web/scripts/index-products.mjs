import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Pinecone } from '@pinecone-database/pinecone'
import admin from 'firebase-admin'
import dotenv from 'dotenv'

// Load env vars from apps/web/.env.local
dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') })

// Dynamically import Transformers.js (ESM)
const { pipeline, env } = await import('@xenova/transformers')

// Tell Transformers.js to cache model in project root
env.cacheDir = resolve(process.cwd(), '.transformers-cache')

// Init Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(resolve(process.cwd(), 'service-account.json'), 'utf-8')
)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}
const db = admin.firestore()

// Init Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

async function main() {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Grizzlywear — Pinecone Indexing Script')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Load CLIP model locally via Transformers.js
  console.log('Loading CLIP model (downloads once ~100MB)...')
  const extractor = await pipeline(
    'image-feature-extraction',
    'Xenova/clip-vit-base-patch32'
  )
  console.log('✓ CLIP model ready')
  console.log('')

  // Fetch all products from Firestore
  console.log('Fetching products from Firestore...')
  const snap = await db.collection('products').get()
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const total = products.length
  console.log(`✓ Found ${total} products`)
  console.log('')

  let success = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const num = `[${i + 1}/${total}]`

    if (!product.images || product.images.length === 0) {
      console.log(`${num} SKIP (no images): ${product.name}`)
      skipped++
      continue
    }

    try {
      // Clean Cloudinary URL — force JPG, resize to 512px for speed
      const imageUrl = product.images[0].includes('/upload/')
        ? product.images[0].replace('/upload/', '/upload/f_jpg,q_80,w_512,h_512,c_fill/')
        : product.images[0]

      console.log(`${num} Indexing: ${product.name}`)

      // Generate CLIP embedding locally
      const output = await extractor(imageUrl, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data)

      // Validate embedding dimensions
      if (embedding.length !== 512) {
        throw new Error(`Unexpected embedding size: ${embedding.length}`)
      }

      // Upsert to Pinecone
      // NOTE: Pinecone SDK v7+ requires { records: [...] } structure
      await index.upsert({
        records: [{
          id: product.id,
          values: embedding,
          metadata: {
            productId: product.id,
            name: product.name ?? '',
            slug: product.slug ?? product.id,
            price: product.price ?? 0,
            comparePrice: product.comparePrice ?? 0,
            category: product.category ?? '',
            imageUrl: product.images[0],
            inStock: product.inStock ?? true,
          }
        }]
      })

      success++
      console.log(`  ✓ Indexed (${embedding.length} dims)`)

    } catch (err) {
      failed++
      console.error(`  ✗ Failed: ${err.message}`)
    }

    // 300ms delay between products to avoid overwhelming APIs
    if (i < products.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Indexing complete!`)
  console.log(`   Success: ${success}`)
  console.log(`   Skipped: ${skipped}`)
  if (failed > 0) console.log(`   Failed:  ${failed}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
