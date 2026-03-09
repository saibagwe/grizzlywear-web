import Link from 'next/link';
import { Package, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  // Generate a mock order ID
  const orderId = `GW-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-20 px-4 bg-white relative overflow-hidden">
      
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gray-50 rounded-full blur-3xl -z-10 opacity-50"></div>

      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-24 h-24 bg-black rounded-full text-white flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
          <CheckCircle2 size={48} />
          {/* Pulse effect */}
          <div className="absolute inset-0 border border-black rounded-full animate-ping opacity-20"></div>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-4 uppercase">Order Confirmed</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Thank you for your purchase. We&apos;ve received your order and will let you know once it ships.
          </p>
        </div>

        <div className="bg-[#F9F9F9] border border-gray-100 p-8 text-left relative overflow-hidden">
          {/* Tape accent */}
          <div className="absolute -top-1 -right-4 w-12 h-4 bg-gray-200 rotate-45 transform"></div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-gray-200 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Order Number</p>
              <p className="font-medium text-lg tracking-wider">{orderId}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-right font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Estimated Delivery</p>
              <p className="font-medium sm:text-right text-black">4-6 Business Days</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="w-12 h-12 bg-white flex items-center justify-center border border-gray-100 flex-shrink-0">
               <Package size={20} className="text-gray-400" />
             </div>
             <div className="text-sm">
               We&apos;ll send shipping updates to your email address once your package is on its way.
             </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/account" className="w-full sm:w-auto border border-gray-200 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 hover:border-black transition-colors flex items-center justify-center gap-2">
            View Order <ArrowRight size={14} />
          </Link>
          <Link href="/shop" className="w-full sm:w-auto bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={14} /> Keep Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
