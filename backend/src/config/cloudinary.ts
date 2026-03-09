import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export function initCloudinary(): void {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  Cloudinary not configured. Image uploads will not work.');
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log('✅ Cloudinary configured');
}

export { cloudinary };
