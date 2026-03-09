'use client';

import { useState } from 'react';
import { Package, Search, Truck, MapPin, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId || !email) {
      toast.error('Please enter both Order ID and Email address.');
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
      toast.success('Found order details.');
    }, 1200);
  };

  // Mock progress array for visual tracking timeline
  const timeline = [
    { status: 'Order Placed', date: 'March 14, 2026', time: '10:24 AM', completed: true },
    { status: 'Processing', date: 'March 14, 2026', time: '14:30 PM', completed: true },
    { status: 'In Transit', date: 'March 15, 2026', time: '09:15 AM', completed: true, current: true },
    { status: 'Out for Delivery', date: 'Pending', time: '--:--', completed: false },
    { status: 'Delivered', date: 'Pending', time: '--:--', completed: false },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-4 uppercase text-center">Track Your Order</h1>
        <p className="text-gray-500 text-sm text-center mb-12 max-w-md mx-auto">
          Enter your order number and email address below to see the current status of your shipment.
        </p>

        {!hasSearched ? (
          <div className="bg-white border border-gray-200 p-8 sm:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
            <form onSubmit={handleTrack} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Order Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. GW-123456"
                    className="w-full border border-gray-200 pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-black transition-colors"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required 
                    placeholder="Email used during checkout"
                    className="w-full border border-gray-200 pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-black transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSearching}
                className="w-full bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {isSearching ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>Track Package <Search size={16} /></>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Header Status */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
               {/* Decorative background logo or pattern */}
               <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
                 <Truck size={200} />
               </div>

               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                 <div>
                   <h2 className="text-2xl font-semibold tracking-tight mb-2 uppercase">In Transit</h2>
                   <p className="text-sm text-gray-500">Order {orderId} • Expected Delivery: March 16, 2026</p>
                 </div>
                 
                 <div className="bg-blue-50 text-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                   <Truck size={14} /> On The Way
                 </div>
               </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8">
               <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-8">Tracking History</h3>
               
               <div className="relative border-l border-gray-200 ml-4 space-y-10 pb-4">
                 {timeline.map((event, idx) => (
                   <div key={idx} className="relative pl-8">
                     
                     {/* Node */}
                     <span className={cn(
                       "absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white rings-4 ring-white",
                       event.completed ? "bg-black text-white" : "bg-gray-200 text-transparent",
                       event.current && "bg-blue-500 text-white" // Highlight current step
                     )}>
                        {event.completed && !event.current ? <CheckCircle2 size={12} strokeWidth={3} /> : null}
                        {event.current ? <Truck size={10} strokeWidth={3} /> : null}
                     </span>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                       <div>
                         <p className={cn(
                           "text-sm font-bold uppercase tracking-widest transition-colors",
                           event.completed ? "text-gray-900" : "text-gray-400"
                         )}>{event.status}</p>
                         
                         {event.current && (
                           <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                             <MapPin size={12} /> Package arrived at facility, Mumbai Hub.
                           </p>
                         )}
                       </div>

                       <div className="text-xs text-gray-500 text-left sm:text-right">
                         <p>{event.date}</p>
                         <p>{event.time}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Reset */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setHasSearched(false)}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4"
              >
                Track Another Order
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
