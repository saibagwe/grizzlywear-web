'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Package, Heart, MapPin, User, ChevronRight, Plus, X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { subscribeToProducts, type FirestoreProduct } from '@/lib/firestore/productService';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import {
  updateUserProfile,
  getAddresses,
  addAddress as addAddressToFirestore,
  updateAddress as updateAddressInFirestore,
  deleteAddress as deleteAddressFromFirestore,
  setDefaultAddress as setDefaultInFirestore,
  type FirestoreAddress,
} from '@/lib/firestore/userService';
import { cn } from '@/lib/utils';

type TabType = 'profile' | 'orders' | 'wishlist' | 'addresses';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

/* ── Skeleton helper ── */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200 animate-pulse rounded', className)} />;
}

/* ── Initials Avatar ── */
function InitialsAvatar({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
  return (
    <div className="rounded-full bg-black text-white flex items-center justify-center font-bold tracking-widest" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function AccountPage() {
  const { firebaseUser, profile, user, logout, refreshProfile, loading: authLoading } = useAuthStore();
  const { wishlistedIds, toggleFavorite: toggleWishlist } = useWishlistStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // ── Profile form state ──
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Address state ──
  const [addresses, setAddresses] = useState<FirestoreAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<FirestoreAddress | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});
  const [addrSaving, setAddrSaving] = useState(false);

  // ── Orders state ──
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const uid = firebaseUser?.uid;
  const displayName = profile?.fullName || firebaseUser?.displayName || 'Guest';
  const firstName = displayName.split(' ')[0] || 'there';

  // Derived Wishlist Products — from Firestore
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const wishlistProducts = allProducts.filter((p: FirestoreProduct) => wishlistedIds.includes(p.id));

  useEffect(() => {
    if (activeTab === 'wishlist') {
      const unsub = subscribeToProducts((prods) => setAllProducts(prods));
      return () => unsub();
    }
  }, [activeTab]);

  // Pre-fill profile form
  useEffect(() => {
    if (profile && !profileLoaded) {
      setFormFullName(profile.fullName || '');
      setFormPhone(profile.phone || '');
      setFormDob(profile.dateOfBirth || '');
      setFormGender(profile.gender || '');
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    if (!uid) return;
    setAddressLoading(true);
    try {
      const data = await getAddresses(uid);
      setAddresses(data);
    } catch {
      setAddresses([]);
    }
    setAddressLoading(false);
  }, [uid]);

  useEffect(() => {
    if (uid && activeTab === 'addresses') {
      loadAddresses();
    }
  }, [uid, activeTab, loadAddresses]);

  // Load orders
  const loadOrders = useCallback(async () => {
    if (!uid) return;
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, 'users', uid, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => {
        const d = doc.data();
        let dateObj = d.createdAt ? d.createdAt.toDate() : new Date();
        return {
          id: d.orderId,
          date: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          status: d.status || 'processing',
          total: d.pricing?.total || 0,
          items: d.items || [],
        };
      });
      setOrders(data);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOrders([]);
    }
    setOrdersLoading(false);
  }, [uid]);

  useEffect(() => {
    if (uid && activeTab === 'orders') {
      loadOrders();
    }
  }, [uid, activeTab, loadOrders]);

  // Profile form changed?
  const profileChanged = profile
    ? formFullName !== (profile.fullName || '') ||
      formPhone !== (profile.phone || '') ||
      formDob !== (profile.dateOfBirth || '') ||
      formGender !== (profile.gender || '')
    : false;

  const handleSaveProfile = async () => {
    if (!uid) return;
    const errors: Record<string, string> = {};
    if (formFullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters';
    if (formPhone && !/^\d{10}$/.test(formPhone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setProfileSaving(true);
    try {
      await updateUserProfile(uid, {
        fullName: formFullName.trim(),
        phone: formPhone.replace(/\s/g, ''),
        dateOfBirth: formDob,
        gender: formGender,
      });
      await refreshProfile();
      toast.success('Profile updated successfully ✓');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setProfileSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  // ── Address modal helpers ──
  const openAddAddress = () => {
    setAddrForm({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
    setEditingAddress(null);
    setAddrErrors({});
    setShowAddressModal(true);
  };
  const openEditAddress = (addr: FirestoreAddress) => {
    setAddrForm({ label: addr.label, name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setEditingAddress(addr);
    setAddrErrors({});
    setShowAddressModal(true);
  };

  const validateAddress = (): boolean => {
    const e: Record<string, string> = {};
    if (!addrForm.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(addrForm.phone.replace(/\s/g, ''))) e.phone = 'Valid 10-digit phone required';
    if (!addrForm.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!addrForm.city.trim()) e.city = 'City is required';
    if (!addrForm.state) e.state = 'State is required';
    if (!/^\d{6}$/.test(addrForm.pincode.replace(/\s/g, ''))) e.pincode = 'Valid 6-digit pincode required';
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!uid || !validateAddress()) return;
    setAddrSaving(true);
    const data = { ...addrForm, phone: addrForm.phone.replace(/\s/g, ''), pincode: addrForm.pincode.replace(/\s/g, '') };
    try {
      if (editingAddress) {
        await updateAddressInFirestore(uid, editingAddress.id, data);
      } else {
        await addAddressToFirestore(uid, data);
      }
      await loadAddresses();
      setShowAddressModal(false);
      toast.success(editingAddress ? 'Address updated successfully' : 'Address saved successfully');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setAddrSaving(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!uid) return;
    try {
      await deleteAddressFromFirestore(uid, id);
      setDeleteConfirmId(null);
      await loadAddresses();
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!uid) return;
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    try {
      await setDefaultInFirestore(uid, id);
      await loadAddresses();
      toast.success('Default address updated');
    } catch {
      await loadAddresses();
      toast.error('Failed to update. Please try again.');
    }
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
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-2 uppercase">
            Hello, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            Welcome back, {displayName}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="flex items-center gap-4 mb-6 lg:mb-8">
              {firebaseUser?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firebaseUser.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <InitialsAvatar name={displayName} size={48} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{firebaseUser?.email}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 sticky top-28">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center justify-between px-5 py-4 text-xs font-bold uppercase tracking-widest transition-all',
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black cursor-pointer'
                    )}
                  >
                    <div className="flex items-center gap-3"><Icon size={16} />{tab.label}</div>
                    {isActive && <ChevronRight size={16} />}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 text-red-500 hover:border-red-500 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut size={16} /> Log Out
              </button>
            </nav>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 bg-white border border-gray-100 p-6 sm:p-10 shadow-sm">

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-medium mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">Personal Information</h2>

                {/* Avatar section */}
                <div className="flex items-center gap-5 mb-8">
                  {firebaseUser?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firebaseUser.photoURL} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <InitialsAvatar name={formFullName || displayName} size={80} />
                  )}
                  <button onClick={() => toast('Photo upload coming soon')} className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-gray-600">
                    Change Photo
                  </button>
                </div>

                {!profileLoaded && authLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i}><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-12 w-full" /></div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Full Name</label>
                        <input type="text" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]" />
                        {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Email Address</label>
                        <input type="email" value={firebaseUser?.email || ''} disabled className="w-full border border-gray-200 px-4 py-3 text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
                        <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Phone Number</label>
                        <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="9876543210" className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]" />
                        {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Date of Birth</label>
                        <input type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Gender</label>
                        <select value={formGender} onChange={(e) => setFormGender(e.target.value)} className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-[#F9F9F9]">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-10">
                      <button
                        onClick={handleSaveProfile}
                        disabled={!profileChanged || profileSaving}
                        className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {profileSaving && <Loader2 size={14} className="animate-spin" />}
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-medium mb-6 uppercase tracking-widest border-b border-gray-100 pb-4">Order History</h2>
                
                {ordersLoading ? (
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-gray-200">
                        <div className="bg-[#F9F9F9] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="p-6 space-y-4">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-4">
                            <Skeleton className="w-20 h-24" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
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
                          <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Order # {order.id}</p>
                            <Link href={`/orders/confirmation/${order.id}`} className="text-[10px] font-bold uppercase tracking-widest text-black hover:underline mt-1">View Details</Link>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-6">
                            <span className={cn('w-2 h-2 rounded-full', order.status === 'delivered' ? 'bg-green-500' : (order.status === 'packed' || order.status === 'shipped') ? 'bg-yellow-500' : 'bg-blue-500')} />
                            <span className="text-sm font-bold uppercase tracking-widest">{order.status}</span>
                          </div>
                          <div className="space-y-6">
                            {order.items.map((item: any, idx: number) => (
                              <div key={`${order.id}-item-${idx}`} className="flex gap-4">
                                <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0 border border-gray-200">
                                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link href={`/shop/${item.productId}`} className="text-sm font-medium hover:underline underline-offset-4 line-clamp-1">{item.name}</Link>
                                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Size: {item.size} • Color: {item.color} | Qty: {item.quantity}</p>
                                  <p className="text-sm font-medium mt-2">₹{item.price.toLocaleString('en-IN')}</p>
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
                    <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">Start Shopping</Link>
                  </div>
                )}
              </div>
            )}

            {/* ── WISHLIST TAB ── */}
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
                          {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />}
                        </Link>
                        <button onClick={() => toggleWishlist(product.id)} className="absolute top-2 right-2 p-2 z-20 rounded-full bg-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm">
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
                    <Link href="/shop" className="inline-block border border-black px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">Discover Products</Link>
                  </div>
                )}
              </div>
            )}

            {/* ── ADDRESSES TAB ── */}
            {activeTab === 'addresses' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-medium uppercase tracking-widest">Saved Addresses</h2>
                  <button onClick={openAddAddress} className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-black hover:text-gray-600">
                    <Plus size={14} /> Add New
                  </button>
                </div>

                {addressLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-gray-200 p-6">
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-6" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-200 p-6 relative group">
                        {addr.isDefault && (
                          <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">Default</span>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin size={16} className="text-gray-400" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">{addr.label}</h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mb-6">
                          <p className="font-medium text-black">{addr.name}</p>
                          <p>{addr.line1}</p>
                          {addr.line2 && <p>{addr.line2}</p>}
                          <p>{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="pt-2">Phone: {addr.phone}</p>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-gray-100 text-xs">
                          <button onClick={() => openEditAddress(addr)} className="flex items-center gap-1 font-bold uppercase tracking-widest hover:text-black text-gray-500 transition-colors">
                            <Pencil size={12} /> Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => setDeleteConfirmId(addr.id)} className="flex items-center gap-1 font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                          {!addr.isDefault && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => handleSetDefault(addr.id)} className="font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                                Set as Default
                              </button>
                            </>
                          )}
                        </div>

                        {deleteConfirmId === addr.id && (
                          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 border border-red-200">
                            <p className="text-sm font-medium mb-4 text-center">Delete this address?</p>
                            <div className="flex gap-3">
                              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-black transition-colors">Cancel</button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={openAddAddress} className="border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors min-h-[200px]">
                      <Plus size={24} className="mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">Add New Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-16 border border-gray-200 bg-[#F9F9F9]">
                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No saved addresses</p>
                    <p className="text-sm text-gray-500 mb-6">Add your first delivery address.</p>
                    <button onClick={openAddAddress} className="inline-block bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">Add Address</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Address Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddressModal(false)} />
          <div className="relative bg-white w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-8">
            <button onClick={() => setShowAddressModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-light uppercase tracking-tight mb-6">{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Label</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((l) => (
                    <button key={l} onClick={() => setAddrForm({ ...addrForm, label: l })} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${addrForm.label === l ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                      {l === 'Home' ? '🏠' : l === 'Office' ? '🏢' : '📍'} {l}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { key: 'name' as const, label: 'Full Name *', placeholder: 'Full name' },
                { key: 'phone' as const, label: 'Phone * (10 digits)', placeholder: '9876543210' },
                { key: 'line1' as const, label: 'Address Line 1 *', placeholder: 'House/Flat, Street' },
                { key: 'line2' as const, label: 'Address Line 2', placeholder: 'Landmark (optional)' },
                { key: 'city' as const, label: 'City *', placeholder: 'City' },
                { key: 'pincode' as const, label: 'Pincode * (6 digits)', placeholder: '400001' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">{label}</label>
                  <input type="text" value={addrForm[key]} onChange={(e) => setAddrForm({ ...addrForm, [key]: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder={placeholder} />
                  {addrErrors[key] && <p className="text-xs text-red-500 mt-1">{addrErrors[key]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">State *</label>
                <select value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {addrErrors.state && <p className="text-xs text-red-500 mt-1">{addrErrors.state}</p>}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} className="w-4 h-4 accent-black" />
                <span className="text-xs uppercase tracking-widest font-bold">Set as default address</span>
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddressModal(false)} className="flex-1 border border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:border-black transition-colors">Cancel</button>
              <button onClick={handleSaveAddress} disabled={addrSaving} className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {addrSaving && <Loader2 size={14} className="animate-spin" />}
                {addrSaving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
