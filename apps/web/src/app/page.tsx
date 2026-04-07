'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'sonner';
import { Truck, RotateCcw, ShieldCheck, MessageCircleHeart, Instagram, Shield } from 'lucide-react';
import { subscribeToProducts, type FirestoreProduct } from '@/lib/firestore/productService';

gsap.registerPlugin(ScrollTrigger);


// ----- Three.js Particles (Untouched hero bg) -----
function ParticleField(props: unknown) {
  const ref = useRef<THREE.Points>(null);
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...(props as Record<string, unknown>)}>
        <PointMaterial transparent color="#ffffff" size={0.005} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

export default function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const editLeftRef = useRef<HTMLDivElement>(null);
  const editRightRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const socialTrackRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const newsletterRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore data
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const visibleProducts = allProducts;
  const flaggedNewArrivals = visibleProducts.filter((p: FirestoreProduct) => p.isNew);
  const newArrivals = (flaggedNewArrivals.length > 0 ? flaggedNewArrivals : visibleProducts).slice(0, 4);

  const flaggedFeatured = visibleProducts.filter((p: FirestoreProduct) => p.isFeatured);
  const featuredFallbackPool = visibleProducts.filter((p: FirestoreProduct) => !newArrivals.some((n) => n.id === p.id));
  const featuredEdit = (
    flaggedFeatured.length > 0
      ? flaggedFeatured
      : (featuredFallbackPool.length > 0 ? featuredFallbackPool : visibleProducts)
  ).slice(0, 4);

  useEffect(() => {
    const unsub = subscribeToProducts((prods) => setAllProducts(prods));
    return () => unsub();
  }, []);

  useEffect(() => {
    // 1. Hero Reveal (Untouched)
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 })
      .fromTo(subRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.8')
      .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.8');

    // 2. Parallax Hero Background (Untouched)
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

    // 3. Categories Parallax Images (Enhanced)
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

    // 5. The Grizz Edit Split Animation
    if (editLeftRef.current && editRightRef.current) {
      gsap.fromTo(editLeftRef.current,
        { x: -50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: editLeftRef.current, start: 'top 80%' }
        }
      );
      gsap.fromTo(editRightRef.current,
        { x: 50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2,
          scrollTrigger: { trigger: editLeftRef.current, start: 'top 80%' }
        }
      );
    }

    // 7. Newsletter Fade
    if (newsletterRef.current) {
      gsap.fromTo(newsletterRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: newsletterRef.current, start: 'top 85%' }
        }
      );
    }

  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const cleanups: Array<() => void> = [];
    const bindTilt = (card: HTMLElement, imageSelector: string, intensity = 12) => {
      const image = card.querySelector<HTMLElement>(imageSelector);
      gsap.set(card, {
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      });

      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3.out' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3.out' });
      const cardY = gsap.quickTo(card, 'y', { duration: 0.45, ease: 'power3.out' });
      const imgScale = image
        ? gsap.quickTo(image, 'scale', { duration: 0.55, ease: 'power3.out' })
        : null;
      const imgX = image
        ? gsap.quickTo(image, 'x', { duration: 0.55, ease: 'power3.out' })
        : null;
      const imgY = image
        ? gsap.quickTo(image, 'y', { duration: 0.55, ease: 'power3.out' })
        : null;

      const onMove = (event: MouseEvent) => {
        const bounds = card.getBoundingClientRect();
        const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const relY = (event.clientY - bounds.top) / bounds.height - 0.5;

        rotateY(relX * intensity);
        rotateX(-relY * intensity);
        cardY(-4);
        imgScale?.(1.06);
        imgX?.(relX * 10);
        imgY?.(relY * 10);
      };

      const onLeave = () => {
        rotateX(0);
        rotateY(0);
        cardY(0);
        imgScale?.(1);
        imgX?.(0);
        imgY?.(0);
      };

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };

    const ctx = gsap.context(() => {
      const droppedCards = gsap.utils.toArray<HTMLElement>('.home-drop-card');
      if (droppedCards.length && newArrivalsRef.current) {
        gsap.fromTo(
          droppedCards,
          { autoAlpha: 0, y: 48, scale: 0.96, filter: 'blur(10px)' },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.95,
            ease: 'power4.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: newArrivalsRef.current,
              start: 'top 78%',
            },
          }
        );

        droppedCards.forEach((card) => {
          bindTilt(card, '.home-drop-image', 10);

          const image = card.querySelector<HTMLElement>('.home-drop-image');
          if (image) {
            gsap.fromTo(
              image,
              { yPercent: -5, scale: 1.08 },
              {
                yPercent: 8,
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1,
                },
              }
            );
          }
        });
      }

      const featuredCards = gsap.utils.toArray<HTMLElement>('.home-feature-card');
      if (featuredCards.length && editRightRef.current) {
        gsap.fromTo(
          featuredCards,
          {
            autoAlpha: 0,
            y: 60,
            scale: 0.94,
            clipPath: 'inset(0 0 20% 0)',
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            clipPath: 'inset(0 0 0% 0)',
            duration: 1,
            ease: 'power4.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: editRightRef.current,
              start: 'top 78%',
            },
          }
        );

        featuredCards.forEach((card) => bindTilt(card, '.home-feature-image', 8));
      }

      const socialCards = gsap.utils.toArray<HTMLElement>('.social-item');
      if (socialCards.length && socialRef.current) {
        gsap.fromTo(
          socialCards,
          { autoAlpha: 0, y: 30, scale: 0.95 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: socialRef.current,
              start: 'top 82%',
            },
          }
        );

        socialCards.forEach((card) => bindTilt(card, '.social-image', 6));
      }

      if (socialTrackRef.current && socialRef.current) {
        gsap.fromTo(
          socialTrackRef.current,
          { xPercent: -2 },
          {
            xPercent: 2,
            ease: 'none',
            scrollTrigger: {
              trigger: socialRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          }
        );
      }
    }, pageRef);

    ScrollTrigger.refresh();

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [newArrivals.length, featuredEdit.length, allProducts.length]);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thanks for subscribing! Check your inbox.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div ref={pageRef}>
      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 1] }}>
            <ParticleField />
          </Canvas>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-10" />
        <div className="relative z-20 text-center px-4 flex flex-col items-center">
          <div ref={titleRef} className="opacity-0 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6">
            <Image src="https://res.cloudinary.com/dstmv07tf/image/upload/v1773157679/logo1_be0zr0.png" alt="Grizzlywear Logo" width={140} height={140} className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" priority />
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extralight text-white tracking-[0.2em] uppercase">
              GRIZZLYWEAR
            </h1>
          </div>
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 z-20">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ===== 3.1 OFFERS TICKER ===== */}
      <div className="sticky top-[72px] z-40 w-full bg-black text-white overflow-hidden py-2 border-b border-gray-900 border-t">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center text-xs sm:text-sm tracking-widest uppercase font-medium">
              <span className="mx-4 text-gray-500">•</span>
              FREE SHIPPING ON ORDERS ABOVE ₹999
              <span className="mx-4 text-gray-500">•</span>
              NEW ARRIVALS EVERY FRIDAY
              <span className="mx-4 text-gray-500">•</span>
              USE CODE GRIZZ10 FOR 10% OFF YOUR FIRST ORDER
              <span className="mx-4 text-gray-500">•</span>
              EASY 7-DAY RETURNS
              <span className="mx-4 text-gray-500">•</span>
              SIZING HELP? CHAT WITH GRIZZ AI →
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3.2 NEW ARRIVALS ===== */}
      <section ref={newArrivalsRef} className="py-24 sm:py-32 bg-white relative z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight uppercase mb-4">Just Dropped</h2>
            <p className="text-sm sm:text-base text-gray-500 uppercase tracking-widest">Fresh styles. Limited drops. Get them before they&apos;re gone.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {newArrivals.length === 0 ? (
              <div className="col-span-4 py-12 text-center text-gray-400 text-sm uppercase tracking-widest">No new arrivals yet</div>
            ) : newArrivals.map((p: FirestoreProduct) => (
              <Link href={`/shop/${p.slug}`} key={p.id} className="home-drop-card product-card group cursor-pointer block will-change-transform">
                <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden relative">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="home-drop-image object-cover transition-opacity duration-500 group-hover:opacity-0" sizes="(max-width: 768px) 100vw, 25vw" />}
                  {p.images[1] && <Image src={p.images[1] || p.images[0]} alt={`${p.name} Alt`} fill className="home-drop-image object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105 group-hover:scale-100 ease-out" sizes="(max-width: 768px) 100vw, 25vw" />}
                  <div className="absolute top-4 left-4 bg-white px-2 py-1 text-[10px] uppercase font-bold tracking-widest z-10">New</div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{p.name}</h3>
                    <p className="text-sm text-gray-500">
                      ₹{p.price.toLocaleString('en-IN')}
                      {p.comparePrice && <span className="line-through ml-2 text-gray-400">₹{p.comparePrice.toLocaleString('en-IN')}</span>}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-end pr-4">
            <Link href="/shop?category=new-arrivals" className="text-sm font-medium tracking-widest uppercase hover:underline underline-offset-8 transition-all">
              View All New Arrivals →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 3.3 CATEGORY SHOWCASE (Enhanced) ===== */}
      <section className="bg-white relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {[
            { title: 'Men', count: '48 STYLES', href: '/shop?category=men', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1000&auto=format&fit=crop' },
            { title: 'Women', count: '42 STYLES', href: '/shop?category=women', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop' },
          ].map((cat, i) => (
            <Link
              key={cat.title}
              href={cat.href}
              ref={(el) => { categoryRefs.current[i] = el; }}
              className="group relative h-[60vh] md:h-[80vh] flex flex-col justify-end p-8 sm:p-12 overflow-hidden bg-black"
            >
              <div className="absolute inset-0 w-full h-full">
                <Image src={cat.img} alt={cat.title} fill className="cat-img object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="relative z-10 w-full">
                <p className="text-xs tracking-[0.2em] font-medium text-white/70 mb-2">{cat.count}</p>
                <h3 className="text-4xl sm:text-5xl font-light text-white tracking-[0.1em] uppercase mb-4">
                  {cat.title}
                </h3>
                <span className="text-xs tracking-[0.2em] uppercase text-white inline-block border border-white/30 px-6 py-2 group-hover:bg-white group-hover:text-black transition-all duration-300">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 3.4 THE GRIZZ EDIT ===== */}
      <section className="bg-[#0A0A0A] text-white py-24 sm:py-32 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Column - Copy */}
            <div ref={editLeftRef} className="w-full lg:w-1/3 opacity-0">
              <h2 className="text-xs tracking-[0.3em] text-gray-500 uppercase font-medium mb-4">Curated Collection</h2>
              <h3 className="text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.9] mb-8">The<br />Grizz<br />Edit.</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-10 max-w-sm">
                Curated for the bold. Worn by the fearless. A hand-picked selection of our most disruptive silhouettes and premium heavyweights.
              </p>
              <Link href="/shop" className="inline-block border border-white px-8 py-4 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300">
                Shop The Edit →
              </Link>
            </div>

            {/* Right Column - 2x2 Grid */}
            <div ref={editRightRef} className="w-full lg:w-2/3 opacity-0">
              <div className="grid grid-cols-2 gap-4 lg:gap-8">
                {featuredEdit.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-gray-500 text-sm uppercase tracking-widest">No featured products yet</div>
                ) : featuredEdit.map((p: FirestoreProduct) => (
                  <Link href={`/shop/${p.slug}`} key={p.id} className="home-feature-card group relative aspect-[4/5] bg-[#111] overflow-hidden will-change-transform">
                    {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="home-feature-image object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" sizes="(max-width: 1024px) 50vw, 33vw" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <p className="text-sm font-medium text-white mb-1">{p.name}</p>
                      <p className="text-xs text-gray-300">₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3.5 SOCIAL PROOF ===== */}
      <section ref={socialRef} className="py-24 sm:py-32 bg-white overflow-hidden">
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl sm:text-5xl font-light uppercase tracking-tight mb-4">Wear It. Share It.</h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            Tag us <a href="https://www.instagram.com/grizzlywear.in/" target="_blank" rel="noreferrer" className="text-black font-medium hover:underline">@grizzlywear.in</a> for a chance to be featured
          </p>
        </div>

        {/* Scrolling or Static Grid of 6 */}
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
          <div ref={socialTrackRef} className="flex gap-2 px-4 sm:px-8 min-w-max mx-auto">
            {allProducts.slice(0, 6).map((p: FirestoreProduct, i: number) => (
              <a href="https://www.instagram.com/grizzlywear.in/" target="_blank" rel="noreferrer" key={i} className="social-item group relative w-[250px] sm:w-[300px] aspect-square bg-gray-100 flex-shrink-0 snap-center overflow-hidden will-change-transform">
                {(p.images[2] || p.images[0]) && <Image src={p.images[2] || p.images[0]} alt="Instagram Post" fill className="social-image object-cover group-hover:scale-110 transition-transform duration-700" sizes="300px" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-center flex flex-col items-center">
                    <Instagram size={32} className="mb-2" />
                    <span className="text-xs font-semibold tracking-widest uppercase">@grizzlywear.in</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3.6 TRUST SIGNALS ===== */}
      <section className="bg-[#F5F5F5] py-16 border-y border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On all orders above ₹999' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'Razorpay · UPI · Cards' },
              { icon: MessageCircleHeart, title: 'AI Support', desc: 'Chat with Grizz, our AI' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <feature.icon size={32} strokeWidth={1} className="mb-4 text-black" />
                <h4 className="text-sm font-bold uppercase tracking-widest mb-2">{feature.title}</h4>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3.7 NEWSLETTER ===== */}
      <section ref={newsletterRef} className="bg-black text-white py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-light uppercase tracking-widest mb-4">Stay In The Loop</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-10">New drops, exclusive offers, and zero spam. Just Grizzlywear.</p>

          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              required
              placeholder="ENTER YOUR EMAIL"
              className="flex-grow bg-transparent border border-white/20 px-6 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white transition-colors"
            />
            <button type="submit" className="bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Discreet Admin Access */}
      <Link 
        href="/login?redirect=/admin/dashboard"
        className="fixed bottom-4 right-4 z-[100] p-1.5 text-gray-300/10 hover:text-gray-400/40 transition-all duration-1000 group"
        aria-label="Admin Access"
      >
        <Shield size={8} />
      </Link>
    </div>
  );
}
