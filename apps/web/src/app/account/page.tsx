'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Package, Heart, MapPin, User, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { MOCK_ORDERS, MOCK_ADDRESSES, MOCK_PRODUCTS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type TabType = 'profile' | 'orders' | 'wishlist' | 'addresses';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const { wishlistedIds, toggleFavorite: toggleWishlist } = useWishlistStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Derived Wishlist Products
  const wishlistProducts = MOCK_PRODUCTS.filter(p => wishlistedIds.includes(p.id));

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  ] as const;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-2 uppercase">My Account</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            Welcome back, {user?.displayName || 'Guest'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2 sticky top-28">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                      isActive 
                        ? "bg-black text-white" 
                        : "bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      {tab.label}
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </button>
                );
              })}
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 text-red-500 hover:border-red-500 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 bg-white border border-gray-100 p-6 sm:p-10 shadow-sm">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-medium mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.displayName || 'Mock User'} 
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || 'mock@example.com'} 
                      disabled
                      className="w-full border border-gray-200 px-4 py-3 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+91 00000 00000" 
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Date of Birth</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]"
                    />
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={() => toast.success('Profile updated successfully')}
                    className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-medium mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">Order History</h2>
                
                {MOCK_ORDERS.length > 0 ? (
                  <div className="space-y-6">
                    {MOCK_ORDERS.map((order) => (
                      <div key={order.id} className="border border-gray-200">
                        <div className="bg-[#F9F9F9] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Order Placed</p>
                              <p className="text-sm font-medium">{order.date}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Total</p>
                              <p className="text-sm font-medium">₹{order.total.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Order # {order.id}</p>
                            <Link href="#" className="text-sm text-black underline underline-offset-4 hover:text-gray-600">View Invoice</Link>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-6">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              order.status === 'delivered' ? "bg-green-500" : 
                              (order.status === 'packed' || order.status === 'shipped') ? "bg-yellow-500" : "bg-blue-500"
                            )} />
                            <span className="text-sm font-bold uppercase tracking-widest">{order.status}</span>
                            {order.status === 'delivered' && <span className="text-sm text-gray-500 ml-2">on {order.date}</span>}
                          </div>

                          <div className="space-y-6">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0 border border-gray-200">
                                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link href={`/shop/${item.product.slug}`} className="text-sm font-medium hover:underline underline-offset-4 line-clamp-1">{item.product.name}</Link>
                                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Size: {item.size} | Qty: {item.quantity}</p>
                                  <p className="text-sm font-medium mt-2">₹{item.product.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="hidden sm:block">
                                  <button className="border border-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-black transition-colors">
                                    Buy Again
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 border border-gray-200 bg-[#F9F9F9]">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No orders yet</p>
                    <p className="text-sm text-gray-500 mb-6">When you place an order, it will appear here.</p>
                    <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-medium uppercase tracking-widest">Saved Items</h2>
                  <span className="text-xs text-gray-500 uppercase tracking-widest">{wishlistProducts.length} Items</span>
                </div>
                
                {wishlistProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
                    {wishlistProducts.map((product) => (
                      <div key={product.id} className="group relative block">
                        <Link href={`/shop/${product.slug}`} className="block relative aspect-[3/4] bg-[#F5F5F5] mb-3 overflow-hidden">
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                        </Link>
                        
                        <button 
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-2 right-2 p-2 z-20 rounded-full bg-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm"
                        >
                          <Heart size={14} className="fill-red-500 text-red-500" />
                        </button>

                        <Link href={`/shop/${product.slug}`} className="block">
                          <h3 className="text-xs font-medium mb-1 truncate group-hover:underline underline-offset-4">{product.name}</h3>
                          <p className="text-xs text-gray-500">₹{product.price.toLocaleString('en-IN')}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 border border-gray-200 bg-[#F9F9F9]">
                    <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
                    <p className="text-sm text-gray-500 mb-6">Save items you love to review them later.</p>
                    <Link href="/shop" className="inline-block border border-black px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
                      Discover Products
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-medium uppercase tracking-widest">Saved Addresses</h2>
                  <button className="text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:text-gray-600">
                    Add New
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {MOCK_ADDRESSES.map((address) => (
                    <div key={address.id} className="border border-gray-200 p-6 relative group">
                      {address.isDefault && (
                        <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">Default</span>
                      )}
                      
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin size={16} className="text-gray-400" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">{address.label}</h3>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1 mb-6">
                        <p className="font-medium text-black">{address.name}</p>
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>{address.city}, {address.state} {address.pincode}</p>
                        <p className="pt-2">Phone: {address.phone}</p>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button className="text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4">Edit</button>
                        {!address.isDefault && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:underline underline-offset-4">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add New Card */}
                  <button className="border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors min-h-[200px]">
                    <span className="text-2xl font-light mb-2">+</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Add New Address</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
