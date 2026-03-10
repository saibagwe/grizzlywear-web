/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

type CategoryKey = 'men' | 'women' | 'accessories' | 'new-arrivals';

type CategoryData = {
  image: string;
  eyebrow: string;
  heading: string;
  tagline: string;
  badge: string;
  badgePulse?: boolean;
  subcategories: string[];
};

const CATEGORY_MAP: Record<CategoryKey, CategoryData> = {
  men: {
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1600&q=80',
    eyebrow: 'GRIZZLYWEAR / MEN\'S',
    heading: 'MEN\'S COLLECTION',
    tagline: 'Built for the streets. Worn for life.',
    badge: '48 STYLES',
    subcategories: ['All', 'T-Shirts', 'Hoodies', 'Joggers', 'Overshirts'],
  },
  women: {
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80',
    eyebrow: 'GRIZZLYWEAR / WOMEN\'S',
    heading: 'WOMEN\'S COLLECTION',
    tagline: 'Effortless. Bold. Unapologetically you.',
    badge: '52 STYLES',
    subcategories: ['All', 'Crop Tops', 'Hoodies', 'Wide-Leg Pants', 'Co-ords'],
  },
  accessories: {
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600&q=80',
    eyebrow: 'GRIZZLYWEAR / ACCESSORIES',
    heading: 'ACCESSORIES',
    tagline: 'The details that define you.',
    badge: '24 PIECES',
    subcategories: ['All', 'Caps', 'Tote Bags', 'Socks'],
  },
  'new-arrivals': {
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=80',
    eyebrow: 'GRIZZLYWEAR / NEW IN',
    heading: 'JUST DROPPED',
    tagline: 'Fresh every Friday. First come, first served.',
    badge: 'UPDATED THIS WEEK',
    badgePulse: true,
    subcategories: ['Drop 01 — Jan', 'Drop 02 — Feb', 'Drop 03 — Mar ← Current'],
  },
};

type Props = {
  category: CategoryKey;
  activeSubcategory: string;
  onSubcategoryChange: (sub: string) => void;
};

export default function CategoryHeader({ category, activeSubcategory, onSubcategoryChange }: Props) {
  const data = CATEGORY_MAP[category];
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // GSAP animations on mount
  useEffect(() => {
    if (!imageRef.current) return;

    // Ken Burns zoom-out
    gsap.fromTo(imageRef.current,
      { scale: 1.08 },
      { scale: 1.0, duration: 1.4, ease: 'power2.out' }
    );

    // Text stagger in
    const textEls = [eyebrowRef.current, headingRef.current, taglineRef.current, badgeRef.current].filter(Boolean);
    gsap.fromTo(textEls,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
  }, [category]);

  // Mouse parallax (desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !imageRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const shiftX = (x - 0.5) * 24;
    const shiftY = (y - 0.5) * 12;
    gsap.to(imageRef.current, { x: shiftX, y: shiftY, duration: 0.6, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    if (isTouchDevice || !imageRef.current) return;
    gsap.to(imageRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
  };

  if (!data) return null;

  return (
    <div>
      {/* Hero image header */}
      <div
        ref={containerRef}
        className="relative overflow-hidden w-full h-[240px] sm:h-[300px] lg:h-[420px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background image */}
        <img
          ref={imageRef}
          src={data.image}
          alt={data.heading}
          className="absolute inset-0 w-full h-full object-cover object-top will-change-transform"
          style={{ transform: 'scale(1.08)' }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Text overlay — bottom left */}
        <div className="absolute bottom-0 left-0 p-4 sm:p-8 md:p-12">
          <p
            ref={eyebrowRef}
            className="text-white/60 mb-2 opacity-0"
            style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            {data.eyebrow}
          </p>
          <h2
            ref={headingRef}
            className="text-white font-bold leading-none mb-3 opacity-0"
            style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800 }}
          >
            {data.heading}
          </h2>
          <p
            ref={taglineRef}
            className="text-white/75 mb-4 opacity-0"
            style={{ fontSize: 'clamp(14px, 1.8vw, 18px)' }}
          >
            {data.tagline}
          </p>
          <span
            ref={badgeRef}
            className="inline-flex items-center gap-2 text-white opacity-0"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {data.badgePulse && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
            {data.badge}
          </span>
        </div>
      </div>

      {/* Subcategory filter strip */}
      <div className="w-full border-b border-[#E5E5E5] bg-white overflow-x-auto scrollbar-hide">
        <div className="flex items-center h-[52px] gap-2 px-4 sm:px-8 md:px-12 min-w-max">
          {data.subcategories.map((sub) => {
            const isActive = activeSubcategory === sub;
            return (
              <button
                key={sub}
                onClick={() => onSubcategoryChange(sub)}
                className="transition-colors whitespace-nowrap"
                style={{
                  padding: '8px 20px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  background: isActive ? '#000' : '#fff',
                  color: isActive ? '#fff' : '#666',
                  border: `1px solid ${isActive ? '#000' : '#E5E5E5'}`,
                }}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
