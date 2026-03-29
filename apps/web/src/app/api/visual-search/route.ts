import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { resolve } from 'path';
import sharp from 'sharp';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const inputBuffer = Buffer.from(base64Data, 'base64');

    // Decode and resize with sharp to raw pixel data
    const { data, info } = await sharp(inputBuffer)
      .resize(512, 512, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json({ error: 'PINECONE_API_KEY not configured' }, { status: 500 });
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      return NextResponse.json({ error: 'PINECONE_INDEX_NAME not configured' }, { status: 500 });
    }

    // Generate CLIP embedding locally via Transformers.js for 100% reliability
    const { pipeline, env, RawImage } = await import('@xenova/transformers');
    
    // Explicitly point to the same cache directory as the indexing script in project root
    env.cacheDir = resolve(process.cwd(), '.transformers-cache');

    const extractor = await pipeline(
      'image-feature-extraction',
      'Xenova/clip-vit-base-patch32'
    );

    // Create RawImage manually from raw pixel data
    const image = new RawImage(data, info.width, info.height, info.channels);

    // Pass the RawImage to Transformers.js
    const output = await extractor(image, { 
      pooling: 'mean', 
      normalize: true 
    } as any);
    const embedding = Array.from(output.data);

    // Validate embedding
    if (embedding.length !== 512) {
      throw new Error('Invalid embedding dimension from local CLIP model');
    }

    // Query Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    const results = await index.query({
      vector: embedding,
      topK: 8,
      includeMetadata: true,
    });

    // Map and filter results
    const matches = results.matches
      .filter((m) => (m.score ?? 0) > 0.15)
      .map((m) => ({
        productId: m.metadata?.productId as string,
        slug: m.metadata?.slug as string,
        name: m.metadata?.name as string,
        price: m.metadata?.price as number,
        comparePrice: (m.metadata?.comparePrice as number) || null,
        category: m.metadata?.category as string,
        imageUrl: m.metadata?.imageUrl as string,
        inStock: (m.metadata?.inStock as boolean) ?? true,
        score: Math.round((m.score ?? 0) * 100),
      }));

    return NextResponse.json({ matches });

  } catch (error: any) {
    console.error('[/api/visual-search]', error);
    return NextResponse.json(
      { error: error.message || 'Visual search failed' },
      { status: 500 }
    );
  }
}
