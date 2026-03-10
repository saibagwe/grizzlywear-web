'use client';

import { useState, useRef, useCallback } from 'react';
import gsap from 'gsap';

const perks = [
  { icon: '🚀', title: 'Move Fast', desc: 'We ship decisions in days, not months.' },
  { icon: '🎨', title: 'Create Freely', desc: 'Your ideas matter here. Every team member shapes the brand.' },
  { icon: '🌱', title: 'Grow With Us', desc: 'We\'re early. The opportunity is massive.' },
];

const positions = [
  {
    title: 'Frontend Developer (Next.js / React)',
    location: 'Remote / Mumbai',
    type: 'Full-time',
    desc: 'We\'re building one of India\'s most cinematic fashion sites. We need someone who cares as much about GSAP animations as they do about TypeScript.',
    email: 'careers@grizzlywear.in?subject=Frontend Developer Application',
  },
  {
    title: 'Graphic Designer',
    location: 'Mumbai (Hybrid)',
    type: 'Full-time',
    desc: 'Packaging, social, campaigns — you\'ll design the visual language of the brand.',
    email: 'careers@grizzlywear.in?subject=Graphic Designer Application',
  },
  {
    title: 'Social Media & Content Creator',
    location: 'Remote',
    type: 'Part-time / Contract',
    desc: 'Shoot, edit, post, repeat. We want someone who lives on Instagram and gets the brand.',
    email: 'careers@grizzlywear.in?subject=Content Creator Application',
  },
  {
    title: 'Operations & Fulfillment Associate',
    location: 'Kalyan, Mumbai',
    type: 'Full-time',
    desc: 'Handle orders, coordinate with couriers, keep the supply chain tight.',
    email: 'careers@grizzlywear.in?subject=Operations Associate Application',
  },
];

export default function CareersPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = useCallback((idx: number) => {
    const el = contentRefs.current[idx];
    if (!el) return;

    if (openIdx === idx) {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => setOpenIdx(null) });
    } else {
      if (openIdx !== null && contentRefs.current[openIdx]) {
        gsap.to(contentRefs.current[openIdx]!, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.in' });
      }
      setOpenIdx(idx);
      gsap.set(el, { height: 'auto', opacity: 1 });
      const h = el.scrollHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, [openIdx]);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">Join the Pack</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">We&apos;re always looking for hungry, creative people.</p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {perks.map((p) => (
            <div key={p.title} className="border border-gray-100 p-8 text-center">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="mb-20">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-gray-400">Open Positions</h2>
          <div className="border-t border-gray-100">
            {positions.map((pos, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={pos.title} className={`border-b border-gray-100 ${isOpen ? 'border-l-[3px] border-l-black pl-4' : ''}`}>
                  <button onClick={() => toggle(idx)} className="w-full flex items-center justify-between py-5 text-left group">
                    <span className="text-sm font-medium text-black pr-4">{pos.title}</span>
                    <span className="text-gray-400 text-lg flex-shrink-0 group-hover:text-black transition-colors">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div ref={(el) => { contentRefs.current[idx] = el; }} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
                    <div className="pb-6 space-y-3">
                      <div className="flex gap-4 text-xs text-gray-400 uppercase tracking-widest">
                        <span>{pos.location}</span>
                        <span>·</span>
                        <span>{pos.type}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{pos.desc}</p>
                      <a href={`mailto:${pos.email}`} className="inline-block bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
                        Apply Now
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Don't see your role */}
        <div className="text-center border-t border-gray-100 pt-12">
          <h2 className="text-lg font-light uppercase tracking-tight mb-4">Don&apos;t See Your Role?</h2>
          <p className="text-sm text-gray-500 mb-6">We hire for talent, not just titles. Send us your portfolio and tell us why you belong here.</p>
          <a href="mailto:careers@grizzlywear.in" className="inline-block border border-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
            Drop Us a Line
          </a>
        </div>
      </div>
    </div>
  );
}
