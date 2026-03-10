'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sections = [
  {
    title: 'OUR PROMISE',
    content: 'We want you to love everything you receive from Grizzlywear. If something isn\'t right, we\'ll make it right.',
  },
  {
    title: 'RETURN ELIGIBILITY',
    content: `• Items can be returned within 7 days of delivery
• Items must be unworn, unwashed, and in original condition
• Tags must be intact and packaging must be included
• Sale items and accessories (caps, socks) are final sale — no returns`,
  },
  {
    title: 'HOW TO RETURN',
    content: `Step 1: Go to My Orders in your account and select "Request Return"
Step 2: Choose the item(s) and reason for return
Step 3: We'll schedule a free pickup within 24–48 hours
Step 4: Refund processed within 5–7 business days after we receive the item`,
  },
  {
    title: 'EXCHANGES',
    content: `• Exchanges are available for size or colour changes
• Subject to availability
• Follow the same process as returns — select "Exchange" instead of "Return"`,
  },
  {
    title: 'REFUNDS',
    content: `• Refunds are issued to your original payment method
• UPI/Card: 5–7 business days
• Cash on Delivery: Refunded via bank transfer (NEFT) within 7 business days`,
  },
  {
    title: 'DAMAGED OR WRONG ITEM?',
    content: 'Email us at support@grizzlywear.in with your order number and photos. We\'ll resolve it within 24 hours — guaranteed.',
  },
];

export default function ReturnsPage() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sectionRefs.current.forEach((el) => {
      if (!el) return;
      gsap.fromTo(el, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">Returns &amp; Exchanges</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Hassle-free. No questions asked.</p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {sections.map((section, i) => (
            <div key={section.title} ref={(el) => { sectionRefs.current[i] = el; }} className="opacity-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-black">{section.title}</h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link href="/account" className="inline-block bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Go to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
