'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ----- Three.js Particles -----
function ParticleField(props: any) {
  const ref = useRef<any>();
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#ffffff" size={0.005} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

// ----- Mock Data -----
const FEATURED_PRODUCTS = [
  { id: 1, name: 'Oversized Onyx Hoodie', price: '₹3,499', image: 'https://images.unsplash.com/photo-1556821840-0f3bdc42323f?q=80&w=800&auto=format&fit=crop' },
  { id: 2, name: 'Essential Cargo Pants', price: '₹4,299', image: 'https://images.unsplash.com/photo-1624378439575-d1ead6bb2ac7?q=80&w=800&auto=format&fit=crop' },
  { id: 3, name: 'Technical Windbreaker', price: '₹5,999', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop' },
  { id: 4, name: 'Heavyweight Graphic Tee', price: '₹1,899', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop' },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const featuredRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    // 1. Hero Reveal Animation
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 })
      .fromTo(subRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.8')
      .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.8');

    // 2. Parallax Hero Background (tied to scroll)
    gsap.to(heroRef.current, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // 3. Featured Products Stagger
    const products = featuredRef.current?.querySelectorAll('.product-card');
    if (products) {
      gsap.fromTo(products, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuredRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    // 4. Categories Parallax Images
    categoryRefs.current.forEach((el) => {
      if (!el) return;
      const img = el.querySelector('.cat-img');
      gsap.fromTo(img, 
        { scale: 1.2, yPercent: -10 },
        {
          scale: 1,
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      );
    });
  }, []);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center bg-black overflow-hidden">
        {/* Three.js Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 1] }}>
            <ParticleField />
          </Canvas>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-10" />

        <div className="relative z-20 text-center px-4">
          <h1 ref={titleRef} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extralight text-white tracking-[0.2em] uppercase mb-6 opacity-0">
            GRIZZLYWEAR
          </h1>
          <p ref={subRef} className="text-sm sm:text-base text-gray-300 tracking-[0.3em] uppercase mb-10 opacity-0">
            Wear the Wild
          </p>
          <Link
            ref={ctaRef}
            href="/shop"
            className="inline-block bg-white text-black px-10 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-gray-200 transition-all duration-300 opacity-0"
          >
            Shop Now
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 z-20">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section ref={featuredRef} className="py-24 sm:py-32 bg-white relative z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs tracking-[0.2em] uppercase font-medium text-gray-400 block mb-2">Featured</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">Latest Drops</h2>
            </div>
            <Link
              href="/shop"
              className="hidden sm:block text-xs tracking-[0.2em] uppercase font-medium text-gray-500 hover:text-black transition-colors border-b border-gray-300 hover:border-black pb-0.5"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {FEATURED_PRODUCTS.map((p) => (
              <Link href={`/shop/mock-${p.id}`} key={p.id} className="product-card group cursor-pointer block opacity-0">
                <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden relative">
                  <Image 
                    src={p.image} 
                    alt={p.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.price}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 sm:hidden">
            <Link href="/shop" className="bg-white text-black border border-black px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-black hover:text-white transition-all duration-300 inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY SECTIONS ===== */}
      <section className="bg-white relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            { title: 'Men', href: '/shop?category=men', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1000&auto=format&fit=crop' },
            { title: 'Women', href: '/shop?category=women', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop' },
            { title: 'New Arrivals', href: '/shop?category=new-arrivals', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop' },
          ].map((cat, i) => (
            <Link
              key={cat.title}
              href={cat.href}
              ref={(el) => { categoryRefs.current[i] = el; }}
              className="group relative h-[60vh] md:h-[80vh] flex items-end p-8 sm:p-12 overflow-hidden bg-black"
            >
              <div className="absolute inset-0 w-full h-full">
                <Image 
                  src={cat.img} 
                  alt={cat.title} 
                  fill 
                  className="cat-img object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 w-full">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-[0.1em] uppercase mb-2">
                  {cat.title}
                </h3>
                <span className="text-xs tracking-[0.2em] uppercase text-white/70 group-hover:text-white transition-colors relative inline-block overflow-hidden">
                  <span className="block group-hover:-translate-y-full transition-transform duration-300">Explore</span>
                  <span className="block absolute top-full left-0 group-hover:-translate-y-full transition-transform duration-300">Explore →</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== BRAND STATEMENT ===== */}
      <section className="py-32 sm:py-48 bg-white relative z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95] mb-8">
            Redefining<br />Street Culture.
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-gray-500 max-w-2xl mx-auto">
            Born in the streets, designed for the fearless. Grizzlywear is not just clothing —
            it&apos;s a statement. Premium quality, minimal design, maximum attitude.
          </p>
        </div>
      </section>
    </>
  );
}
