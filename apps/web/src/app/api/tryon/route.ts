import { NextRequest, NextResponse } from 'next/server';
import { Client, handle_file } from '@gradio/client';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userImageBase64, garmentImageUrl, productName } = await req.json();

    if (!userImageBase64 || !garmentImageUrl || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.HF_TOKEN) {
      return NextResponse.json({ error: 'HF_TOKEN not configured' }, { status: 500 });
    }

    // Convert userImageBase64 (data URL) to Blob
    const base64Data = userImageBase64.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid image data');
    }
    const userBlob = new Blob(
      [Buffer.from(base64Data, 'base64')],
      { type: 'image/jpeg' }
    );

    // Clean Cloudinary URL and fetch as Blob
    const cleanUrl = garmentImageUrl.replace('/upload/', '/upload/f_jpg,q_90/');
    const garmentRes = await fetch(cleanUrl);
    if (!garmentRes.ok) {
      throw new Error('Failed to fetch garment image');
    }
    const garmentBlob = new Blob(
      [await garmentRes.arrayBuffer()],
      { type: 'image/jpeg' }
    );

    console.log('[/api/tryon] Connecting to HuggingFace...');
    // Connect to HuggingFace
    const client = await Client.connect("yisol/IDM-VTON", {
      // @ts-ignore
      token: process.env.HF_TOKEN
    });

    console.log('[/api/tryon] Calling predict...');
    // Call /tryon with inputs in EXACT order
    const result = await client.predict("/tryon", [
      // @ts-ignore
      { background: handle_file(userBlob), layers: [], composite: null },
      // @ts-ignore
      handle_file(garmentBlob),
      productName,
      true,
      true,
      30,
      42,
      true
    ]);

    console.log('[/api/tryon] Predict successful, data:', JSON.stringify(result.data).substring(0, 200) + '...');

    // Extract image URL
    // @ts-ignore - gradio client types can be tricky
    const imageUrl = result.data[0]?.url ?? result.data[0];

    if (typeof imageUrl !== 'string') {
      throw new Error('Invalid result from HuggingFace');
    }

    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('[/api/tryon]', error);
    return NextResponse.json(
      { error: error.message || 'Try-on failed' },
      { status: 500 }
    );
  }
}
