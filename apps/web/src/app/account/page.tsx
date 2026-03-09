'use client';

import { useAuthStore } from '@/store/authStore';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen pt-20 pb-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-light tracking-tight mb-8">My Account</h1>

        <div className="lg:grid lg:grid-cols-4 lg:gap-12">
          
          {/* Sidebar */}
          <aside className="mb-10 lg:mb-0">
            <nav className="space-y-2">
              <a href="#" className="block px-4 py-3 bg-white border border-gray-200 text-sm font-medium text-black">
                Profile Details
              </a>
              <a href="/account/orders" className="block px-4 py-3 text-sm text-gray-500 hover:bg-white hover:text-black hover:border hover:border-gray-200 transition-colors border border-transparent">
                Order History
              </a>
              <a href="/account/wishlist" className="block px-4 py-3 text-sm text-gray-500 hover:bg-white hover:text-black hover:border hover:border-gray-200 transition-colors border border-transparent">
                Wishlist
              </a>
              <a href="/account/addresses" className="block px-4 py-3 text-sm text-gray-500 hover:bg-white hover:text-black hover:border hover:border-gray-200 transition-colors border border-transparent">
                Addresses
              </a>
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border border-transparent"
              >
                Log Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 p-8 sm:p-10">
              <h2 className="text-xl font-medium mb-6">Profile Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.displayName || 'Mock User'} 
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || 'mock@example.com'} 
                    disabled
                    className="w-full border border-gray-200 px-4 py-3 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 Phone Number" 
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors bg-gray-50"
                  />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <button className="bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors">
                  Save Changes
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
