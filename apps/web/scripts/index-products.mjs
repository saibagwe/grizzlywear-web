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
const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

function productToText(product) {
  return [
    `Product: ${product.name ?? 'Unnamed'}`,
    `Category: ${product.category ?? 'N/A'}`,
    `Subcategory: ${product.subcategory ?? 'N/A'}`,
    `Price: INR ${product.price ?? 0}`,
    `Description: ${product.description ?? ''}`,
    `Material: ${product.material ?? ''}`,
    `Fit: ${product.fit ?? ''}`,
    `Sizes: ${(product.sizes ?? []).join(', ')}`,
    `Features: ${(product.features ?? []).join(', ')}`,
    `Tags: ${(product.tags ?? []).join(', ')}`,
  ].join('\n')
}

function buildMetadata(product) {
  return {
    productId: product.id,
    name: product.name ?? '',
    slug: product.slug ?? product.id,
    price: product.price ?? 0,
    comparePrice: product.comparePrice ?? 0,
    category: product.category ?? '',
    imageUrl: (product.images ?? [])[0] ?? '',
    inStock: product.inStock ?? true,
  }
}

async function triggerVertexEmbedding(product) {
  const payload = {
    productId: product.id,
    name: product.name ?? '',
    slug: product.slug ?? product.id,
    price: product.price ?? 0,
    comparePrice: product.comparePrice ?? 0,
    category: product.category ?? '',
    subcategory: product.subcategory ?? '',
    description: product.description ?? '',
    shortDescription: product.shortDescription ?? '',
    material: product.material ?? '',
    fit: product.fit ?? '',
    sizes: product.sizes ?? [],
    features: product.features ?? [],
    tags: product.tags ?? [],
    careInstructions: product.careInstructions ?? [],
    images: product.images ?? [],
    inStock: product.inStock ?? true,
    isFeatured: product.isFeatured ?? false,
    isNew: product.isNew ?? false,
  }

  const response = await fetch(`${aiServiceUrl}/ai/embed-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Vertex pipeline failed (${response.status}): ${await response.text()}`)
  }

  return response.json()
}

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

      const xenovaPromise = (async () => {
        const output = await extractor(imageUrl, { pooling: 'mean', normalize: true })
        const embedding = Array.from(output.data)

        if (embedding.length !== 512) {
          throw new Error(`Unexpected Xenova embedding size: ${embedding.length}`)
        }

        await index.upsert({
          records: [{
            id: product.id,
            values: embedding,
            metadata: buildMetadata(product),
          }]
        })

        return embedding.length
      })()

      const vertexPromise = triggerVertexEmbedding(product)

      const [xenovaResult, vertexResult] = await Promise.allSettled([
        xenovaPromise,
        vertexPromise,
      ])

      if (xenovaResult.status === 'fulfilled') {
        console.log(`  ✓ Xenova indexed (${xenovaResult.value} dims)`)
      } else {
        console.warn(`  ⚠ Xenova pipeline failed: ${xenovaResult.reason?.message ?? xenovaResult.reason}`)
      }

      if (vertexResult.status === 'fulfilled') {
        console.log('  ✓ Vertex multimodal pipeline completed')
      } else {
        console.warn(`  ⚠ Vertex pipeline failed: ${vertexResult.reason?.message ?? vertexResult.reason}`)
      }

      if (xenovaResult.status === 'fulfilled' || vertexResult.status === 'fulfilled') {
        success++
      } else {
        failed++
      }

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
