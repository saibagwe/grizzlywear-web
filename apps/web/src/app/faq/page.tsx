'use client';

import { useState, useRef, useCallback } from 'react';
import gsap from 'gsap';

const faqSections = [
  {
    title: 'ORDERS & SHIPPING',
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days across India. Express delivery (2–3 days) is available for ₹99.' },
      { q: 'Do you offer free shipping?', a: 'Yes! Free standard shipping on all orders above ₹999.' },
      { q: 'Can I track my order?', a: 'Yes. Go to My Orders in your account, or use our Track Order page with your order ID and email.' },
      { q: 'Can I change or cancel my order after placing it?', a: 'Orders can be cancelled within 2 hours of placement. After that, please initiate a return once the item is delivered.' },
    ],
  },
  {
    title: 'RETURNS & EXCHANGES',
    items: [
      { q: 'What is your return policy?', a: 'We offer easy 7-day returns from the date of delivery. Items must be unworn, unwashed, and in original packaging with tags attached.' },
      { q: 'How do I initiate a return?', a: 'Go to My Orders → select the order → click "Request Return". We\'ll schedule a free pickup.' },
      { q: 'When will I receive my refund?', a: 'Refunds are processed within 5–7 business days after we receive the returned item.' },
      { q: 'Can I exchange for a different size?', a: 'Yes! Select "Exchange" during the return process and specify the new size.' },
    ],
  },
  {
    title: 'PRODUCTS & SIZING',
    items: [
      { q: 'How do I find my size?', a: 'Check our Size Guide for detailed measurements. If you\'re between sizes, we recommend sizing up. You can also ask Grizz AI for personalised sizing help.' },
      { q: 'Are your products true to size?', a: 'Our regular fit items are true to size. Oversized items are intentionally larger — check the product description for fit notes.' },
      { q: 'What materials do you use?', a: 'We use 100% combed cotton for most of our basics, and cotton-blend fabrics for our heavier pieces. Full material details are on each product page.' },
    ],
  },
  {
    title: 'ACCOUNT & PAYMENTS',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking, and cash on delivery.' },
      { q: 'Is it safe to save my payment details?', a: 'We use Razorpay for all payments — your card details are never stored on our servers.' },
      { q: 'Can I shop without creating an account?', a: 'You can browse and add to cart without an account, but you\'ll need to log in to complete your purchase.' },
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, and we\'ll send a reset link to your email.' },
    ],
  },
];

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggle = useCallback((key: string) => {
    const el = contentRefs.current[key];
    if (!el) return;

    if (openKey === key) {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => setOpenKey(null) });
    } else {
      // Close previous
      if (openKey && contentRefs.current[openKey]) {
        gsap.to(contentRefs.current[openKey]!, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.in' });
      }
      setOpenKey(key);
      gsap.set(el, { height: 'auto', opacity: 1 });
      const h = el.scrollHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, [openKey]);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">FAQs</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Everything you need to know.</p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {faqSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-gray-400">{section.title}</h2>
              <div className="space-y-0 border-t border-gray-100">
                {section.items.map((item) => {
                  const key = `${section.title}-${item.q}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} className={`border-b border-gray-100 ${isOpen ? 'border-l-[3px] border-l-black pl-4' : 'pl-0'}`}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between py-5 text-left group"
                      >
                        <span className="text-sm font-medium text-black pr-4">{item.q}</span>
                        <span className="text-gray-400 text-lg flex-shrink-0 group-hover:text-black transition-colors">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        ref={(el) => { contentRefs.current[key] = el; }}
                        className="overflow-hidden"
                        style={{ height: 0, opacity: 0 }}
                      >
                        <p className="text-sm text-gray-600 leading-relaxed pb-5">{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
