'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const values = [
  { icon: '🐻', title: 'QUALITY FIRST', desc: 'Premium combed cotton. Double-stitched seams. No shortcuts.' },
  { icon: '🌱', title: 'SUSTAINABLY MINDED', desc: 'We\'re working towards responsible sourcing and packaging.' },
  { icon: '🤝', title: 'COMMUNITY', desc: 'Grizzlywear is worn by real people, not just influencers.' },
  { icon: '🇮🇳', title: 'MADE FOR INDIA', desc: 'Designed for Indian bodies, weather, and streets.' },
];

export default function AboutPage() {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sectionsRef.current.forEach((el) => {
      if (!el) return;
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80)' }}
        />
        <div className="relative text-center z-10">
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight uppercase text-white mb-4">Wear the Wild</h1>
          <p className="text-sm text-gray-300 uppercase tracking-[0.3em]">Born in India. Built for the fearless.</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20">
        {/* Our Story */}
        <div ref={(el) => { sectionsRef.current[0] = el; }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 opacity-0">
          <div>
            <p className="text-2xl sm:text-3xl font-light text-black leading-snug italic">
              &ldquo;We didn&apos;t follow the trend. We built against it.&rdquo;
            </p>
          </div>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>Grizzlywear started with a simple idea: that streetwear in India should be premium without being pretentious. Built for young people who know what they want and aren&apos;t afraid to wear it.</p>
            <p>Founded in Kalyan, Mumbai, we design every piece with the Indian body, climate, and attitude in mind. From our oversized tees to our wide-leg joggers — every cut is intentional.</p>
            <p>No logos for the sake of logos. No trends for the sake of likes. Just clothing that means something.</p>
          </div>
        </div>

        {/* Values */}
        <div ref={(el) => { sectionsRef.current[1] = el; }} className="mb-24 opacity-0">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-center mb-12 text-gray-400">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="border border-gray-100 p-8 text-center">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div ref={(el) => { sectionsRef.current[2] = el; }} className="mb-24 text-center opacity-0">
          <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tight mb-6">Built by a Small Team with Big Ideas</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            We&apos;re a small team of designers, developers, and dreamers based in Mumbai. Every decision — from fabric weight to website animation — is made by people who actually wear the clothes.
          </p>
        </div>

        {/* CTA */}
        <div ref={(el) => { sectionsRef.current[3] = el; }} className="text-center border-t border-gray-100 pt-16 opacity-0">
          <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tight mb-8">Ready to Wear the Wild?</h2>
          <Link href="/shop" className="inline-block bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Shop the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
