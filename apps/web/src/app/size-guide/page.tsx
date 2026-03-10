'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

const sizeTabs = ["MEN'S TOPS", "MEN'S BOTTOMS", "WOMEN'S TOPS", "WOMEN'S BOTTOMS"] as const;

const sizeData: Record<string, { headers: string[]; rows: string[][] }> = {
  "MEN'S TOPS": {
    headers: ['Size', 'Chest (in)', 'Shoulder (in)', 'Length (in)'],
    rows: [['XS','36','16.5','27'],['S','38','17.0','28'],['M','40','17.5','29'],['L','42','18.0','30'],['XL','44','18.5','31'],['XXL','46','19.0','32']],
  },
  "MEN'S BOTTOMS": {
    headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)'],
    rows: [['XS','28','36','40'],['S','30','38','41'],['M','32','40','42'],['L','34','42','43'],['XL','36','44','44'],['XXL','38','46','45']],
  },
  "WOMEN'S TOPS": {
    headers: ['Size', 'Bust (in)', 'Waist (in)', 'Length (in)'],
    rows: [['XS','32','26','24'],['S','34','28','25'],['M','36','30','26'],['L','38','32','27'],['XL','40','34','28'],['XXL','42','36','29']],
  },
  "WOMEN'S BOTTOMS": {
    headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)'],
    rows: [['XS','26','34','38'],['S','28','36','39'],['M','30','38','40'],['L','32','40','41'],['XL','34','42','42'],['XXL','36','44','43']],
  },
};

const measurementGuide = [
  { label: 'Chest/Bust', desc: 'Measure around the fullest part of your chest, keeping the tape parallel to the floor.' },
  { label: 'Waist', desc: 'Measure around your natural waistline, at the narrowest point.' },
  { label: 'Hip', desc: 'Measure around the fullest part of your hips, about 8 inches below the waist.' },
  { label: 'Shoulder', desc: 'Measure from the tip of one shoulder to the tip of the other across the back.' },
  { label: 'Length (tops)', desc: 'From the highest point of the shoulder, straight down to the hem.' },
  { label: 'Inseam (bottoms)', desc: 'From the crotch seam to the bottom of the leg.' },
];

const fitGuide = [
  { label: 'Regular Fit', desc: 'True to size. If you\'re between sizes, go up.' },
  { label: 'Oversized Fit', desc: 'Size down for a relaxed look, or go true to size for extra oversized.' },
  { label: 'Slim Fit', desc: 'If between sizes, go up for comfort.' },
];

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<string>(sizeTabs[0]);
  const tableRef = useRef<HTMLDivElement>(null);
  const data = sizeData[activeTab];

  useEffect(() => {
    if (tableRef.current) {
      gsap.fromTo(tableRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">Size Guide</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Find your perfect fit.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {sizeTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-black'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div ref={tableRef} className="mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black text-white">
                  {data.headers.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure */}
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6">How to Measure</h2>
          <div className="space-y-4">
            {measurementGuide.map((item) => (
              <div key={item.label}>
                <span className="font-medium text-sm text-black">{item.label}:</span>
                <span className="text-sm text-gray-600 ml-2">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Our Fit Guide */}
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6">Our Fit Guide</h2>
          <div className="space-y-4">
            {fitGuide.map((item) => (
              <div key={item.label}>
                <span className="font-medium text-sm text-black">{item.label}:</span>
                <span className="text-sm text-gray-600 ml-2">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border-t border-gray-100 pt-12">
          <p className="text-sm text-gray-500 mb-4">Still unsure?</p>
          <button
            onClick={() => {
              const event = new CustomEvent('openGrizzChat');
              window.dispatchEvent(event);
            }}
            className="inline-block border border-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
          >
            Chat with Grizz AI →
          </button>
        </div>
      </div>
    </div>
  );
}
