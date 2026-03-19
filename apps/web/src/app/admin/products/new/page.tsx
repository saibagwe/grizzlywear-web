'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { CldUploadWidget } from 'next-cloudinary';

import {
  createProduct,
  updateProduct,
  getProductById,
  type ProductInput,
  type FirestoreProduct,
} from '@/lib/firestore/productService';

type FormData = {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string;
  category: string;
  subcategory: string;
  stock: string;
  material: string;
  fit: string;
  isFeatured: boolean;
  isNew: boolean;
};

const INITIAL_FORM: FormData = {
  name: '',
  description: '',
  shortDescription: '',
  price: '',
  comparePrice: '',
  category: 'men',
  subcategory: '',
  stock: '',
  material: '',
  fit: '',
  isFeatured: false,
  isNew: false,
};

export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const isEditing = Boolean(editId);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sizes, setSizes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // All product image URLs (existing + newly uploaded via Cloudinary)
  const [images, setImages] = useState<string[]>([]);

  // Load product data when editing
  useEffect(() => {
    if (!editId) return;
    setIsLoading(true);
    getProductById(editId).then((product) => {
      if (!product) {
        toast.error('Product not found.');
        router.push('/admin/products');
        return;
      }
      setFormData({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: String(product.price),
        comparePrice: product.comparePrice ? String(product.comparePrice) : '',
        category: product.category,
        subcategory: product.subcategory,
        stock: String(product.stock),
        material: product.material,
        fit: product.fit,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
      });
      setSizes(product.sizes ?? []);
      setFeatures(product.features ?? []);
      setCareInstructions(product.careInstructions ?? []);
      setTags(product.tags ?? []);
      setImages(product.images ?? []);
      setIsLoading(false);
    });
  }, [editId, router]);

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Tag-style input helpers
  const addToList = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    const trimmed = value.trim();
    if (trimmed) setter((prev) => [...prev, trimmed]);
  };

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addToList(setter, e.currentTarget.value);
      e.currentTarget.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('Please upload at least one product image.');
      return;
    }
    setIsSubmitting(true);

    try {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const price = parseFloat(formData.price);
      const comparePrice = formData.comparePrice ? parseFloat(formData.comparePrice) : undefined;
      const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : undefined;

      const productData: ProductInput = {
        name: formData.name,
        slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price,
        comparePrice,
        discount,
        category: formData.category as FirestoreProduct['category'],
        subcategory: formData.subcategory,
        images,
        sizes,
        colors: [],
        material: formData.material,
        fit: formData.fit,
        careInstructions,
        features,
        stock: parseInt(formData.stock, 10) || 0,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        inStock: (parseInt(formData.stock, 10) || 0) > 0,
        rating: 0,
        reviewCount: 0,
        tags,
      };

      if (isEditing && editId) {
        await updateProduct(editId, productData);
        toast.success('Product updated successfully!');
      } else {
        await createProduct(productData);
        toast.success('Product published successfully!');
      }

      router.push('/admin/products');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/products"
          className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? 'Changes save directly to Firestore and go live immediately.'
              : 'Create a new item. It will appear on the store once published.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* ── Main Column ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Basic Info */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oversized Heavyweight Hoodie"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Brief one-liner for product cards"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Detailed product description..."
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ── Media / Cloudinary ── */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-1">
              Media
            </h2>
            <p className="text-xs text-gray-400 mb-6">Images are uploaded via Cloudinary and stored as URLs in Firestore.</p>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                {images.map((url, i) => (
                  <div key={i} className="relative w-24 h-28 flex-shrink-0 group">
                    <Image
                      src={url}
                      alt={`Product image ${i + 1}`}
                      fill
                      className="object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Cloudinary Upload Widget */}
            <CldUploadWidget
              uploadPreset="grizzlywear_products"
              options={{
                multiple: true,
                maxFiles: 10,
                resourceType: 'image',
                sources: ['local', 'url', 'camera'],
                styles: {
                  palette: {
                    window: '#FFFFFF',
                    windowBorder: '#90A0B3',
                    tabIcon: '#000000',
                    menuIcons: '#5A616A',
                    textDark: '#000000',
                    textLight: '#FFFFFF',
                    link: '#000000',
                    action: '#000000',
                    inactiveTabIcon: '#999999',
                    error: '#F44235',
                    inProgress: '#000000',
                    complete: '#20B832',
                    sourceBg: '#F5F5F5',
                  },
                },
              }}
              onSuccess={(result) => {
                // result.info is the Cloudinary upload result object
                const info = result?.info as { secure_url?: string } | undefined;
                if (info?.secure_url) {
                  setImages((prev) => [...prev, info.secure_url!]);
                  toast.success('Image uploaded successfully!');
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-full border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center hover:bg-gray-50 hover:border-black transition-colors group flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 bg-white border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
                    <ImagePlus size={22} className="text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {images.length > 0 ? 'Upload more images' : 'Click to upload product images'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, WebP — uploaded securely via Cloudinary</p>
                  </div>
                </button>
              )}
            </CldUploadWidget>
          </div>

          {/* Variants */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Variants</h2>
            <div className="space-y-6">
              {/* Sizes */}
              <TagInput
                label="Sizes"
                values={sizes}
                onRemove={(v) => setSizes(sizes.filter((s) => s !== v))}
                onKeyDown={(e) => handleTagKeyDown(e, setSizes)}
                placeholder='Type size and press Enter (e.g. S, M, L)'
              />

              {/* Material */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Material</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Cotton (400gsm)"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>

              {/* Fit */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fit</label>
                <input
                  type="text"
                  placeholder="e.g. Oversized / Boxy fit"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.fit}
                  onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                />
              </div>

              {/* Features */}
              <TagInput
                label="Features"
                values={features}
                onRemove={(v) => setFeatures(features.filter((f) => f !== v))}
                onKeyDown={(e) => handleTagKeyDown(e, setFeatures)}
                placeholder='Type feature and press Enter'
              />

              {/* Care Instructions */}
              <TagInput
                label="Care Instructions"
                values={careInstructions}
                onRemove={(v) => setCareInstructions(careInstructions.filter((c) => c !== v))}
                onKeyDown={(e) => handleTagKeyDown(e, setCareInstructions)}
                placeholder='Type instruction and press Enter'
              />

              {/* Tags */}
              <TagInput
                label="Tags"
                values={tags}
                onRemove={(v) => setTags(tags.filter((t) => t !== v))}
                onKeyDown={(e) => handleTagKeyDown(e, setTags)}
                placeholder='Type tag and press Enter'
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-8 mt-8 lg:mt-0">

          {/* Pricing */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0.00"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Compare At Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Original price for sale badge"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="accessories">Accessories</option>
                  <option value="new-arrivals">New Arrivals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g. hoodies, t-shirts"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Total Inventory <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Stock count"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Flags</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${formData.isFeatured ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isFeatured ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setFormData({ ...formData, isNew: !formData.isNew })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${formData.isNew ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isNew ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">New Arrival</span>
              </label>
            </div>
          </div>

          {/* Image count indicator */}
          {images.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 text-xs font-medium text-green-800">
              ✓ {images.length} image{images.length !== 1 ? 's' : ''} ready
            </div>
          )}

          {/* Submit */}
          <div className="bg-[#F9F9F9] border border-gray-200 p-6 sticky top-28">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEditing ? 'Saving...' : 'Publishing...'}
                </>
              ) : isEditing ? 'Save Changes' : 'Publish Product'}
            </button>
            {isEditing && (
              <Link
                href="/admin/products"
                className="block w-full text-center mt-3 border border-gray-200 bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── TAG INPUT COMPONENT ──────────────────────────────────────────────────────

function TagInput({
  label,
  values,
  onRemove,
  onKeyDown,
  placeholder,
}: {
  label: string;
  values: string[];
  onRemove: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </label>
      <div className="w-full border border-gray-200 px-4 py-3 min-h-[50px] flex flex-wrap gap-2 focus-within:border-black transition-colors">
        {values.map((v) => (
          <span key={v} className="bg-gray-100 px-3 py-1 text-xs font-medium flex items-center gap-1.5">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-gray-400 hover:text-red-600">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 min-w-[160px] outline-none text-sm bg-transparent"
          onKeyDown={onKeyDown}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
}
