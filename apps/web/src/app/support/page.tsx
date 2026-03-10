'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useUIStore } from '@/store/uiStore';

const categories = ['Shipping Issue', 'Wrong Item', 'Return Request', 'Payment Issue', 'Size Help', 'Other'];

export default function SupportPage() {
  const { toggleChat } = useUIStore();
  const [form, setForm] = useState({ subject: '', orderId: '', category: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.category || form.message.length < 20) {
      toast.error('Please fill in all required fields (message must be at least 20 characters).');
      return;
    }
    toast.success('Ticket #TKT-00124 submitted! We\'ll respond within 24 hours.');
    setForm({ subject: '', orderId: '', category: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">We&apos;re Here to Help</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Reach us however works best for you.</p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Chat */}
          <div className="border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Chat with Grizz AI</h3>
            <p className="text-sm text-gray-500 mb-6">Get instant answers from our AI assistant — available 24/7.</p>
            <button onClick={toggleChat} className="w-full bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
              Start Chat
            </button>
          </div>

          {/* Email */}
          <div className="border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-4">📧</div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Email Us</h3>
            <p className="text-sm text-gray-500 mb-2">For complex queries, returns, and order issues.</p>
            <p className="text-sm font-medium text-black mb-1">support@grizzlywear.in</p>
            <p className="text-xs text-gray-400 mb-6">We respond within 24 hours.</p>
            <a href="mailto:support@grizzlywear.in" className="block w-full border border-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors text-center">
              Send Email
            </a>
          </div>

          {/* WhatsApp */}
          <div className="border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3">WhatsApp</h3>
            <p className="text-sm text-gray-500 mb-2">Chat with our team directly on WhatsApp.</p>
            <p className="text-sm font-medium text-black mb-1">+91 73049 67959</p>
            <p className="text-xs text-gray-400 mb-6">Mon–Sat, 10am–7pm IST</p>
            <a href="https://wa.me/917304967959" target="_blank" rel="noopener noreferrer" className="block w-full bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors text-center">
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-2">Submit a Support Ticket</h2>
          <p className="text-sm text-gray-500 mb-8">For logged-in users — track your query and get email updates.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Subject *</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Brief summary of your issue" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Order ID (optional)</label>
              <input type="text" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder="e.g. GW-2024-00123" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Message * (min 20 chars)</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none" placeholder="Describe your issue in detail..." />
            </div>
            <button type="submit" className="w-full bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
              Submit Ticket
            </button>
          </form>

          {/* Business Hours */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-gray-100 pt-12">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Business Hours</h3>
              <p className="text-sm text-gray-600">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
              <p className="text-sm text-gray-600">Sunday: Closed</p>
              <p className="text-sm text-gray-600">Public Holidays: Closed</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Our Office</h3>
              <p className="text-sm text-gray-600">4th Floor, 40, Parshu Ram Patil Building,</p>
              <p className="text-sm text-gray-600">Station Road, Kalyan, Thane,</p>
              <p className="text-sm text-gray-600">Maharashtra 421201</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
