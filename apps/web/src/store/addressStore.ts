import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

interface AddressState {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, updates: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefault: (id: string) => void;
}

const initialAddresses: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    name: 'Rahul Sharma',
    phone: '9876543210',
    line1: '12, Sector 7, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    name: 'Rahul Sharma',
    phone: '9876543210',
    line1: '305, Business Park, Malad East',
    line2: 'Near Infinity Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400097',
    isDefault: false,
  },
];

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: initialAddresses,

      addAddress: (address) =>
        set((state) => {
          const newAddr: Address = {
            ...address,
            id: `addr-${Date.now()}`,
          };
          const updatedAddresses = newAddr.isDefault
            ? state.addresses.map((a) => ({ ...a, isDefault: false }))
            : [...state.addresses];
          return { addresses: [...(newAddr.isDefault ? updatedAddresses : state.addresses), newAddr] };
        }),

      updateAddress: (id, updates) =>
        set((state) => {
          let addresses = state.addresses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          );
          if (updates.isDefault) {
            addresses = addresses.map((a) =>
              a.id === id ? a : { ...a, isDefault: false }
            );
          }
          return { addresses };
        }),

      deleteAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),

      setDefault: (id) =>
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        })),
    }),
    {
      name: 'grizzlywear-addresses',
    }
  )
);
