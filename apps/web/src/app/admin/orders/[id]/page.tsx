'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer, Download, MapPin, Mail, Phone, Package, CreditCard } from 'lucide-react';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = MOCK_ORDERS.find(o => o.id === params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Order {order.id}</h1>
              <span className={cn(
                "inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                order.status.toLowerCase() === 'delivered' ? "bg-green-100 text-green-800" :
                (order.status.toLowerCase() === 'packed' || order.status.toLowerCase() === 'shipped') ? "bg-blue-100 text-blue-800" :
                order.status.toLowerCase() === 'cancelled' ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              )}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Placed on {order.date}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors">
            <Printer size={14} /> Print
          </button>
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors">
            <Download size={14} /> Invoice
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8 flex flex-col-reverse">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Items */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Order Items</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 border border-gray-200">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/shop/${item.product.id}`} className="font-medium text-black hover:underline underline-offset-4">
                          {item.product.name}
                        </Link>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Size: {item.size}</p>
                      </div>
                      <p className="font-medium text-right whitespace-nowrap">₹{item.product.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                       <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
                       <p className="font-bold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-[#F9F9F9] p-6 border-t border-gray-200 space-y-3 text-sm">
               <div className="flex justify-between">
                 <span className="text-gray-500">Subtotal</span>
                 <span className="font-medium">₹{(order.total - 150).toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Shipping</span>
                 <span className="font-medium">₹150</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Tax</span>
                 <span className="font-medium">₹0</span>
               </div>
               <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                 <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                 <span className="text-xl font-medium text-black">₹{order.total.toLocaleString('en-IN')}</span>
               </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8 mt-8 lg:mt-0">
          
          <div className="bg-white border border-gray-200 p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Customer Details</h2>
            
            <div className="space-y-4 text-sm">
               <div className="flex items-start gap-3">
                 <Mail size={16} className="text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-black">Contact Email</p>
                   <p className="text-blue-600 hover:underline cursor-pointer">{order.deliveryAddress?.name.toLowerCase().replace(/ /g, '.')}@example.com</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Phone size={16} className="text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-black">Phone Number</p>
                   <p className="text-gray-600">{order.deliveryAddress.phone}</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
               <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Shipping Info</h2>
               <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">Edit</Link>
            </div>
            
            <div className="space-y-4 text-sm">
               <div className="flex items-start gap-3">
                 <MapPin size={16} className="text-gray-400 mt-0.5" />
                 <div className="text-gray-600 space-y-1">
                   <p className="font-medium text-black">{order.deliveryAddress.name}</p>
                   <p>{order.deliveryAddress.line1}</p>
                   {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
                   <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-3 pt-4 border-t border-gray-50">
                 <Package size={16} className="text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-black border-b border-dashed border-gray-300 pb-0.5 cursor-help" title="Standard Shipping">Standard Delivery</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Payment Info</h2>
            
            <div className="space-y-4 text-sm">
               <div className="flex items-start gap-3">
                 <CreditCard size={16} className="text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-black">Mock Payment</p>
                   <p className="text-green-600 font-medium text-xs mt-1 bg-green-50 w-fit px-2 py-0.5">Paid</p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
