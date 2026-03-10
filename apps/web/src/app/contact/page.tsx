'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const subjects = ['General Inquiry', 'Order Issue', 'Press & Media', 'Partnership', 'Other'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || form.message.length < 30) {
      toast.error('Please fill in all fields (message must be at least 30 characters).');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight uppercase mb-4">Get in Touch</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">We&apos;re a small team. We read every message.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div className="border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Subject *</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                  <option value="">Select a subject</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Message * (min 30 chars)</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none" placeholder="Tell us what's on your mind..." />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📧 Email</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><a href="mailto:support@grizzlywear.in" className="text-black hover:underline">support@grizzlywear.in</a><span className="text-gray-400 ml-2">(customer support)</span></p>
                <p><a href="mailto:press@grizzlywear.in" className="text-black hover:underline">press@grizzlywear.in</a><span className="text-gray-400 ml-2">(media enquiries)</span></p>
                <p><a href="mailto:careers@grizzlywear.in" className="text-black hover:underline">careers@grizzlywear.in</a><span className="text-gray-400 ml-2">(job applications)</span></p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📱 WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-1">+91 73049 67959</p>
              <p className="text-xs text-gray-400 mb-3">Mon–Sat, 10am–7pm IST</p>
              <a href="https://wa.me/917304967959" target="_blank" rel="noopener noreferrer" className="inline-block border border-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
                WhatsApp Us →
              </a>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📍 Office Address</h3>
              <p className="text-sm text-gray-600">4th Floor, 40, Parshu Ram Patil Building,</p>
              <p className="text-sm text-gray-600">Station Road, Kalyan, Thane,</p>
              <p className="text-sm text-gray-600">Maharashtra 421201</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📸 Instagram</h3>
              <a href="https://www.instagram.com/grizzlywear.in/" target="_blank" rel="noopener noreferrer" className="text-sm text-black hover:underline">@grizzlywear.in</a>
              <br />
              <a href="https://www.instagram.com/grizzlywear.in/" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 border border-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
                Follow Us →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
