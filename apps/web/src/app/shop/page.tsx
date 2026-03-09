import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop | Grizzlywear',
  description: 'Browse the latest Grizzlywear collections. Shop men\'s, women\'s, and new arrivals.',
};

// 12 Mock Products
const MOCK_PRODUCTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `mock-${i + 1}`,
  name: i % 2 === 0 ? `Essential Oversized Tee V${i+1}` : `Technical Cargo Pants V${i+1}`,
  price: i % 2 === 0 ? '₹1,499' : '₹3,999',
  category: i % 3 === 0 ? 'Women' : 'Men',
  image: i % 2 === 0 
    ? 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1624378439575-d1ead6bb2ac7?q=80&w=800&auto=format&fit=crop',
}));

export default function ShopPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-3">Shop All</h1>
          <p className="text-sm text-gray-500">
            Premium fashion for the fearless. {MOCK_PRODUCTS.length} products.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-gray-900 mb-4">Category</h3>
                <div className="space-y-3">
                  {['New Arrivals', 'Men', 'Women', 'Accessories'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer hover:text-black group">
                      <div className="w-4 h-4 border border-gray-300 rounded-sm group-hover:border-black flex items-center justify-center transition-colors"></div>
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-gray-900 mb-4">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button key={size} className="w-12 h-10 border border-gray-200 text-xs font-medium hover:border-black hover:bg-black hover:text-white transition-all">
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 hidden sm:block">Showing {MOCK_PRODUCTS.length} products</p>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Sort by</span>
                <select className="text-sm border-none bg-transparent font-medium focus:ring-0 cursor-pointer">
                  <option>Featured</option>
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
              {MOCK_PRODUCTS.map((product) => (
                <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                  <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden relative">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] tracking-wider uppercase font-medium">
                      {product.category}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.price}</p>
                </Link>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <button className="bg-white text-black border border-black px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-black hover:text-white transition-all duration-300">
                Load More
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
