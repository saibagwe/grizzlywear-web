/* eslint-disable @next/next/no-img-element */
'use client';

import { toast } from 'sonner';

const brandAssets = [
  { label: 'Grizzlywear Logo (Black)', img: 'https://via.placeholder.com/400x300/000000/ffffff?text=GRIZZLYWEAR' },
  { label: 'Grizzlywear Logo (White)', img: 'https://via.placeholder.com/400x300/ffffff/000000?text=GRIZZLYWEAR' },
  { label: 'Brand Photography', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80' },
  { label: 'Product Images', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80' },
];

const pressLogos = ['The Hindu', 'YourStory', 'Homegrown', 'Hypebeast India'];

export default function PressPage() {
  const mockDownload = () => {
    toast.success('Press kit download starting...');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">Press &amp; Media</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">For editorial features, collaborations, and media inquiries.</p>
        </div>

        {/* Press Kit */}
        <div className="text-center mb-20 border border-gray-100 p-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-4">Press Kit</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Download our official press kit including brand logos, product images, and brand guidelines.
          </p>
          <button onClick={mockDownload} className="inline-block bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Download Press Kit
          </button>
        </div>

        {/* Brand Assets */}
        <div className="mb-20">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-gray-400">Brand Assets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {brandAssets.map((asset) => (
              <div key={asset.label} className="border border-gray-100 overflow-hidden group">
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                  <img src={asset.img} alt={asset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{asset.label}</span>
                  <button onClick={mockDownload} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Contact */}
        <div className="mb-20 text-center border-t border-gray-100 pt-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-4">Media Contact</h2>
          <p className="text-sm text-gray-500 mb-2">For press enquiries, interview requests, and collaboration pitches:</p>
          <p className="text-sm font-medium text-black mb-1">Press Team, Grizzlywear</p>
          <p className="text-sm text-gray-600 mb-1"><a href="mailto:press@grizzlywear.in" className="hover:underline">press@grizzlywear.in</a></p>
          <p className="text-xs text-gray-400 mb-8">We aim to respond within 48 hours.</p>
          <a href="mailto:press@grizzlywear.in?subject=Press Inquiry" className="inline-block bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Email Press Team
          </a>
        </div>

        {/* Featured In */}
        <div className="text-center">
          <h2 className="text-xs uppercase tracking-[0.2em] mb-8 text-gray-300">As Seen In</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {pressLogos.map((logo) => (
              <span key={logo} className="text-xl sm:text-2xl font-light text-gray-200 tracking-wide">{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
