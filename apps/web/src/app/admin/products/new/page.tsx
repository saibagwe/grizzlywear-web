'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { CldUploadWidget } from 'next-cloudinary';
import { cn } from '@/lib/utils';

import {
  createProduct,
  updateProduct,
  getProductById,
  type ProductInput,
  type FirestoreProduct,
} from '@/lib/firestore/productService';


const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

type FormData = {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string;
  category: string;
  subcategory: string;
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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  // Load product data
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
        material: product.material,
        fit: product.fit,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
      });
      setSelectedSizes(product.sizes ?? []);
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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) setter(prev => [...prev, val]);
      e.currentTarget.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('At least one size must be selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
        category: formData.category as any,
        subcategory: formData.subcategory,
        images,
        sizes: selectedSizes,
        colors: [],
        material: formData.material,
        fit: formData.fit,
        careInstructions,
        features,
        stock: {}, // No stock saved to products collection
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        inStock: true, // Managed by inventory, assume true for now or keep default
        rating: 0,
        reviewCount: 0,
        tags,
      };

      if (isEditing && editId) {
        await updateProduct(editId, productData);
        toast.success('Product updated!');
      } else {
        const productId = await createProduct(productData);
        toast.success('Product created successfully!');
      }
      router.push('/admin/products');
    } catch (err) {
      console.error(err);
      toast.error('Submit failed.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="w-10 h-10 border flex items-center justify-center hover:bg-[var(--bg)]"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Stock is managed through the product stock fields.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Description *</label>
                <textarea required rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border px-4 py-3 text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Media</h2>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                {images.map((url, i) => (
                  <div key={i} className="relative w-24 h-28 border group">
                    <Image src={url} alt={`Img ${i}`} fill className="object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <CldUploadWidget uploadPreset="grizzlywear_products" onSuccess={(res: any) => res.info?.secure_url && setImages(prev => [...prev, res.info.secure_url])}>
              {({ open }) => (
                <button type="button" onClick={() => open()} className="w-full border-2 border-dashed p-10 text-center hover:bg-[var(--bg)] flex flex-col items-center gap-3">
                  <ImagePlus size={22} className="text-[var(--text-muted)]" />
                  <span className="text-sm font-medium">Upload Images</span>
                </button>
              )}
            </CldUploadWidget>
          </div>

          {/* Sizes */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Available Sizes</h2>
            <div className="flex flex-wrap gap-4">
              {AVAILABLE_SIZES.map(size => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <label key={size} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSizes([...selectedSizes, size]);
                        else setSelectedSizes(selectedSizes.filter(s => s !== size));
                      }}
                      className="w-4 h-4 border-gray-300 rounded text-[var(--text-primary)] focus:ring-black"
                    />
                    <span className={cn("text-sm font-bold", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{size}</span>
                  </label>
                );
              })}
            </div>
            {selectedSizes.length === 0 && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase">* Required</p>}
          </div>

          {/* Product Details */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Product Details</h2>
            <TagInput label="Features" values={features} onRemove={(v: string) => setFeatures(features.filter(f => f !== v))} onKeyDown={(e: any) => handleTagKeyDown(e, setFeatures)} />
            <TagInput label="Care Instructions" values={careInstructions} onRemove={(v: string) => setCareInstructions(careInstructions.filter(c => c !== v))} onKeyDown={(e: any) => handleTagKeyDown(e, setCareInstructions)} />
            <TagInput label="Tags" values={tags} onRemove={(v: string) => setTags(tags.filter(t => t !== v))} onKeyDown={(e: any) => handleTagKeyDown(e, setTags)} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Pricing</h2>
            <div className="space-y-4 text-sm">
              <label className="block font-bold text-[var(--text-secondary)] uppercase text-[10px]">Price (₹) *</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full border px-4 py-3" />
              <label className="block font-bold text-[var(--text-secondary)] uppercase text-[10px]">Compare Price (₹)</label>
              <input type="number" value={formData.comparePrice} onChange={e => setFormData({ ...formData, comparePrice: e.target.value })} className="w-full border px-4 py-3" />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-6">Organization</h2>
            <div className="space-y-4">
              <label className="block font-bold text-[var(--text-secondary)] uppercase text-[10px]">Category *</label>
              <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border px-4 py-3 text-sm bg-[var(--bg-card)]">
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="accessories">Accessories</option>
                <option value="new-arrivals">New Arrivals</option>
              </select>
            </div>
          </div>

          <div className="bg-[var(--bg)] border p-6 flex flex-col gap-3 sticky top-28">
            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : (isEditing ? 'Save Changes' : 'Publish Product')}
            </button>
            <Link href="/admin/products" className="w-full border py-4 text-xs font-bold uppercase text-center hover:bg-[var(--bg-card)] bg-[var(--bg)]">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

function TagInput({ label, values, onRemove, onKeyDown }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{label}</label>
      <div className="border border-[var(--border)] p-3 min-h-[50px] flex flex-wrap gap-2 bg-[var(--bg-card)]">
        {values.map((v: string) => (
          <span key={v} className="bg-gray-100 px-3 py-1 text-[10px] font-bold flex items-center gap-2">
            {v} <button type="button" onClick={() => onRemove(v)} className="hover:text-red-500"><X size={10} /></button>
          </span>
        ))}
        <input type="text" placeholder="Type and press Enter" className="flex-1 min-w-[120px] outline-none text-sm" onKeyDown={onKeyDown} />
      </div>
    </div>
  );
}
