export type Product = {
  id: string;
  slug: string;
  name: string;
  category: 'men' | 'women' | 'accessories' | 'new-arrivals';
  subcategory: string;
  price: number;
  comparePrice?: number;
  discount?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  shortDescription: string;
  material: string;
  fit: string;
  careInstructions: string[];
  features: string[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  inStock: boolean;
  tags: string[];
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  avatar?: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
};

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

export type OrderItem = {
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
  trackingId?: string;
  estimatedDelivery?: string;
  deliveryAddress: Address;
};

// ==========================================
// MOCK PRODUCTS (24 Total)
// ==========================================

export const MOCK_PRODUCTS: Product[] = [
  // --- MEN (8) ---
  {
    id: 'prod-m-01',
    slug: 'Grizzly Originals',
    name: 'Grizzly Originals',
    category: 'men',
    subcategory: 'hoodies',
    price: 3499,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161576/CSWM_Black2_yic9aq.jpg',
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161710/CSWM_Black_4_ddjw6k.jpg',
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161710/CSWM_navy2_yedhi2.jpg'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Onyx Black', hex: '#111111' }],
    description: 'The definitive heavyweight hoodie. Crafted from 450gsm premium French terry cotton. Features an extreme drop shoulder, cropped body, and oversized hood for the perfect boxy silhouette. Pre-shrunk and garment dyed for a vintage wash effect.',
    shortDescription: 'Heavyweight 450gsm oversized fit hoodie.',
    material: '100% Premium French Terry Cotton (450gsm)',
    fit: 'Oversized / Boxy fit, true to size',
    careInstructions: ['Machine wash cold', 'Wash with similar colours', 'Do not tumble dry', 'Iron on reverse'],
    features: ['Double-stitched hem', 'Drop shoulder design', 'Unlined oversized hood'],
    rating: 4.8,
    reviewCount: 124,
    isNew: false,
    isFeatured: true,
    inStock: true,
    tags: ['heavyweight', 'essential', 'hoodie']
  },
  {
    id: 'prod-m-02',
    slug: 'essential-cargo-pants',
    name: 'Essential Cargo Pants',
    category: 'men',
    subcategory: 'joggers',
    price: 4299,
    comparePrice: 4999,
    discount: 14,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773162813/2150264165_yifszk.jpg',
      'https://images.unsplash.com/photo-1542272201-b1ca555f8505?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Olive', hex: '#4B5320' }],
    description: 'Tactical functionality meets street aesthetics. Made from durable ripstop cotton blend with articulated knees for movement. Features 6 utility pockets and adjustable ankle toggles for a customisable taper.',
    shortDescription: 'Durable ripstop cargo pants with adjustable taper.',
    material: '97% Cotton, 3% Elastane Ripstop',
    fit: 'Relaxed straight fit with adjustable toggles',
    careInstructions: ['Machine wash cold', 'Fasten all velcro before washing'],
    features: ['6 utility pockets', 'Adjustable ankle toggles', 'Articulated knee darts'],
    rating: 4.6,
    reviewCount: 89,
    isNew: false,
    isFeatured: true,
    inStock: true,
    tags: ['utility', 'cargo', 'bottoms']
  },
  {
    id: 'prod-m-03',
    slug: 'heavyweight-graphic-tee-1',
    name: 'Heavyweight Graphic Tee',
    category: 'men',
    subcategory: 't-shirts',
    price: 1899,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161749/white_oversized_4_kvbpsc.jpg',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Vintage Black', hex: '#222222' }],
    description: 'A 280gsm thick cotton tee built to last. Features a subtle high-density chest print and a bold back graphic. Garment washed for a soft, worn-in feel from day one.',
    shortDescription: '280gsm thick cotton tee with high-density print.',
    material: '100% Combed Cotton (280gsm)',
    fit: 'Boxy fit',
    careInstructions: ['Machine wash cold inside out', 'Do not iron on print'],
    features: ['Ribbed crewneck', 'High-density screen print', 'Garment washed'],
    rating: 4.9,
    reviewCount: 210,
    isNew: true,
    isFeatured: false,
    inStock: true,
    tags: ['graphic', 'tee', 'heavyweight']
  },
  {
    id: 'prod-m-04',
    slug: 'technical-windbreaker',
    name: 'Technical Windbreaker',
    category: 'men',
    subcategory: 'overshirts',
    price: 5999,
    comparePrice: 6999,
    discount: 14,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559582798-678dfc71e8eb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559582930-bc77d6118b76?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Gunmetal', hex: '#2A3439' }],
    description: 'Engineered for the urban commute. Water-resistant outer shell with breathable mesh lining. Features waterproof aquaguard zips, reflective detailing, and a packable hood.',
    shortDescription: 'Water-resistant technical jacket with reflective details.',
    material: '100% Nylon Shell, 100% Polyester Mesh Lining',
    fit: 'Regular fit, room for layering',
    careInstructions: ['Machine wash gentle cold', 'Do not use fabric softener'],
    features: ['Waterproof zips', 'Reflective panels', 'Packable hood'],
    rating: 4.5,
    reviewCount: 42,
    isNew: false,
    isFeatured: true,
    inStock: true,
    tags: ['outerwear', 'technical', 'weather-proof']
  },
  {
    id: 'prod-m-05',
    slug: 'blank-mockneck-tee',
    name: 'Blank Mockneck Tee',
    category: 'men',
    subcategory: 't-shirts',
    price: 1499,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Stark White', hex: '#FFFFFF' }],
    description: 'The foundation of any good fit. An elevated basic featuring a raised mockneck collar. Made from peached cotton for an incredibly soft handfeel.',
    shortDescription: 'Elevated mockneck basic in ultra-soft cotton.',
    material: '100% Peached Cotton (240gsm)',
    fit: 'Relaxed fit',
    careInstructions: ['Machine wash cold', 'Wash with whites'],
    features: ['Mockneck collar', 'Peached finish'],
    rating: 4.7,
    reviewCount: 315,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['basic', 'tee', 'layering']
  },
  {
    id: 'prod-m-06',
    slug: 'acid-wash-zip-hoodie',
    name: 'Acid Wash Zip Hoodie',
    category: 'men',
    subcategory: 'hoodies',
    price: 3699,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161732/Jbear4_koppnn.jpg',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556821840-0f3bdc42323f?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Acid Grey', hex: '#666666' }],
    description: 'A Y2K inspired full-zip hoodie with a heavy acid wash treatment making each piece unique. Features a robust two-way metal YKK zipper and raw edge detailing.',
    shortDescription: 'Y2K inspired acid wash full-zip hoodie.',
    material: '100% Cotton (400gsm)',
    fit: 'Cropped boxy fit',
    careInstructions: ['Hand wash cold separately', 'Colour may bleed'],
    features: ['Unique acid wash', 'Two-way YKK zip'],
    rating: 4.3,
    reviewCount: 56,
    isNew: true,
    isFeatured: false,
    inStock: true,
    tags: ['hoodie', 'acid-wash', 'y2k']
  },
  {
    id: 'prod-m-07',
    slug: 'nylon-track-pants',
    name: 'Nylon Track Pants',
    category: 'men',
    subcategory: 'joggers',
    price: 3299,
    comparePrice: 3999,
    discount: 17,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773163538/Screenshot_from_2026-03-10_22-55-25_g8judj.png',
      'https://images.unsplash.com/photo-1517409259461-840be6d52ab4?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272201-b1ca555f8505?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Midnight Blue', hex: '#191970' }],
    description: 'Retro sporting aesthetics rebuilt for the streets. Lightweight crinkle nylon with mesh lining. Features contrast side piping and zipped cuffs.',
    shortDescription: 'Lightweight crinkle nylon track pants.',
    material: '100% Crinkle Nylon',
    fit: 'Relaxed baggy fit',
    careInstructions: ['Machine wash cold', 'Do not iron'],
    features: ['Contrast piping', 'Zipped cuffs', 'Mesh lined'],
    rating: 4.8,
    reviewCount: 77,
    isNew: false,
    isFeatured: false,
    inStock: false, // Explicitly out of stock
    tags: ['tracksuit', 'nylon', 'bottoms']
  },
  {
    id: 'prod-m-08',
    slug: 'distressed-vintage-tee',
    name: 'Distressed Vintage Tee',
    category: 'men',
    subcategory: 't-shirts',
    price: 1999,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161718/Flared_white_oversized_2_b3ro8i.jpg',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L'],
    colors: [{ name: 'Faded Brown', hex: '#5C4033' }],
    description: 'Hand-distressed edges and a heavy enzyme wash give this tee an authentic vintage thrifts-store feel. Faded crackle-print graphic on the chest.',
    shortDescription: 'Hand-distressed vintage wash tee.',
    material: '100% Cotton (220gsm)',
    fit: 'Standard fit',
    careInstructions: ['Machine wash cold', 'Wash separately'],
    features: ['Hand-distressed collar and hem', 'Crackle print'],
    rating: 4.5,
    reviewCount: 92,
    isNew: true,
    isFeatured: false,
    inStock: true,
    tags: ['vintage', 'tee', 'distressed']
  },

  // --- WOMEN (8) ---
  {
    id: 'prod-w-01',
    slug: 'ribbed-knit-tank-top',
    name: 'Ribbed Knit Tank Top',
    category: 'women',
    subcategory: 'crop tops',
    price: 1299,
    images: [
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1434389678369-e8ad1db7bbdd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Bone', hex: '#F9F6EE' }],
    description: 'The ultimate daily essential. A form-fitting seamless ribbed knit tank top with a high neckline and racerback design. Perfect for layering or wearing on its own.',
    shortDescription: 'Seamless ribbed knit high-neck tank.',
    material: '92% Nylon, 8% Spandex',
    fit: 'Form-fitting outline',
    careInstructions: ['Machine wash cold', 'Lay flat to dry'],
    features: ['Seamless design', 'Double-lined front', 'Racerback'],
    rating: 4.9,
    reviewCount: 340,
    isNew: false,
    isFeatured: true,
    inStock: true,
    tags: ['essential', 'tank', 'ribbed']
  },
  {
    id: 'prod-w-02',
    slug: 'parachute-skirt',
    name: 'Parachute Skirt',
    category: 'women',
    subcategory: 'wide-leg pants',
    price: 2899,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773161555/571011290_17952121209015189_3483500787661898313_n_twjmm4.jpg',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Charcoal', hex: '#36454F' }],
    description: 'A utilitarian take on the maxi skirt. Made from crisp parachute poplin with an elasticated toggle waist and voluminous gather detailing. Side slits for movement.',
    shortDescription: 'Crisp poplin maxi parachute skirt with toggles.',
    material: '100% Cotton Poplin',
    fit: 'Voluminous maxi length',
    careInstructions: ['Dry clean recommended', 'Iron on low'],
    features: ['Toggle waist', 'Side seam pockets', 'Maxi length'],
    rating: 4.6,
    reviewCount: 52,
    isNew: true,
    isFeatured: true,
    inStock: true,
    tags: ['skirt', 'utility', 'parachute']
  },
  {
    id: 'prod-w-03',
    slug: 'cropped-zip-hoodie-w',
    name: 'Cropped Zip-Up Hoodie',
    category: 'women',
    subcategory: 'hoodies',
    price: 2499,
    comparePrice: 2999,
    discount: 16,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Heather Grey', hex: '#9AA297' }],
    description: 'A severely cropped zip-up hoodie hitting right above the waist. Features extra-long sleeves with thumbholes and a chunky silver zipper.',
    shortDescription: 'Severely cropped zip-up with extended sleeves.',
    material: '100% Cotton (350gsm)',
    fit: 'Cropped, relaxed sleeves',
    careInstructions: ['Machine wash cold', 'Tumble dry low'],
    features: ['Extra-long sleeves', 'Thumbholes', 'Chunky silver zip'],
    rating: 4.7,
    reviewCount: 112,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['hoodie', 'cropped', 'layering']
  },
  {
    id: 'prod-w-04',
    slug: 'wide-leg-cargo-sweatpants',
    name: 'Wide-Leg Cargo Sweats',
    category: 'women',
    subcategory: 'wide-leg pants',
    price: 3199,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773163253/2150773390_hcuiwp.jpg',
      'https://images.unsplash.com/photo-1509631179647-0c5000642f15?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Washed Black', hex: '#2C2C2C' }],
    description: 'Sweatpants that do not feel like sweatpants. Heavyweight fleece fabric featuring a dramatic wide-leg opening, a raw hem, and functional cargo pockets.',
    shortDescription: 'Dramatic wide-leg fleece sweatpants with cargo pockets.',
    material: '100% Cotton Fleece (400gsm)',
    fit: 'Extreme wide leg, high waisted',
    careInstructions: ['Machine wash cold', 'Do not tumble dry'],
    features: ['Raw hem', 'Cargo pockets', 'Fleece interior'],
    rating: 4.8,
    reviewCount: 205,
    isNew: true,
    isFeatured: true,
    inStock: true,
    tags: ['sweatpants', 'wide-leg', 'loungewear']
  },
  {
    id: 'prod-w-05',
    slug: 'seamless-bike-shorts',
    name: 'Seamless Bike Shorts',
    category: 'women',
    subcategory: 'wide-leg pants',
    price: 1499,
    images: [
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574634534894-89d7576c8259?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Espresso', hex: '#3B2F2F' }],
    description: 'Sculpting seamless bike shorts with a compressive ribbed waistband. Squat-proof, sweat-wicking, and designed with no front seam.',
    shortDescription: 'Sculpting squat-proof seamless bike shorts.',
    material: '87% Nylon, 13% Elastane',
    fit: 'Compressive skin-tight fit',
    careInstructions: ['Machine wash cold', 'Do not use fabric softener'],
    features: ['No front seam', 'Compressive waist band', 'Squat-proof'],
    rating: 4.9,
    reviewCount: 420,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['activewear', 'shorts', 'seamless']
  },
  {
    id: 'prod-w-06',
    slug: 'asymmetric-baby-tee',
    name: 'Asymmetric Baby Tee',
    category: 'women',
    subcategory: 'crop tops',
    price: 999,
    comparePrice: 1499,
    discount: 33,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'White', hex: '#FFFFFF' }],
    description: 'A 90s-inspired shrunken baby tee with an asymmetrical slanted hem and contrast stitch detailing. Features a tiny Grizzlywear logo hit on the chest.',
    shortDescription: '90s-inspired shrunken tee with asymmetric hem.',
    material: '95% Cotton, 5% Elastane',
    fit: 'Shrunken tight fit',
    careInstructions: ['Machine wash cold'],
    features: ['Asymmetric hem', 'Contrast stitching', 'High stretch'],
    rating: 4.4,
    reviewCount: 68,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['baby-tee', '90s', 'top']
  },
  {
    id: 'prod-w-07',
    slug: 'monochrome-co-ord-set',
    name: 'Monochrome Co-ord Set',
    category: 'women',
    subcategory: 'co-ords',
    price: 3999,
    images: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Midnight', hex: '#121212' }],
    description: 'A matching two-piece set featuring an oversized short-sleeve button-down shirt and relaxed flowing shorts. Made from a breathable linen-blend perfect for high summer.',
    shortDescription: 'Relaxed linen-blend matching shirt and shorts set.',
    material: '55% Linen, 45% Viscose',
    fit: 'Oversized relaxed fit',
    careInstructions: ['Hand wash cold', 'Iron while damp'],
    features: ['Two-piece set', 'Elastic waist shorts', 'Breathable fabric'],
    rating: 4.8,
    reviewCount: 145,
    isNew: true,
    isFeatured: true,
    inStock: true,
    tags: ['set', 'summer', 'linen']
  },
  {
    id: 'prod-w-08',
    slug: 'backless-halter-top',
    name: 'Backless Halter Top',
    category: 'women',
    subcategory: 'crop tops',
    price: 1899,
    images: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Crimson', hex: '#8B0000' }],
    description: 'A slinky backless halter top crafted from double-layered slinky jersey. Features a draped cowl neckline and long adjustable back ties for multiple styling options.',
    shortDescription: 'Slinky jersey backless halter with cowl neck.',
    material: '92% Polyester, 8% Spandex',
    fit: 'Draped front, fully open back',
    careInstructions: ['Dry clean only'],
    features: ['Cowl neckline', 'Adjustable multi-way ties', 'Double lined'],
    rating: 4.5,
    reviewCount: 38,
    isNew: false,
    isFeatured: false,
    inStock: false,
    tags: ['evening', 'top', 'halter']
  },

  // --- ACCESSORIES (4) ---
  {
    id: 'prod-a-01',
    slug: 'signature-trucker-cap',
    name: 'Signature Trucker Cap',
    category: 'accessories',
    subcategory: 'caps',
    price: 899,
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1575428652377-a2d80b224828?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556821840-0f3bdc42323f?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['OS'],
    colors: [{ name: 'Black/White', hex: '#111111' }],
    description: 'A classic high-profile trucker cap featuring a foam front panel with raised puff-print Grizzlywear branding and breathable mesh back panels. Adjustable snapback closure.',
    shortDescription: 'Classic foam-front trucker cap with puff print.',
    material: '100% Polyester front, Mesh back',
    fit: 'One Size Fits All (Adjustable)',
    careInstructions: ['Spot clean only'],
    features: ['High profile crown', 'Puff print logo', 'Adjustable snapback'],
    rating: 4.7,
    reviewCount: 201,
    isNew: false,
    isFeatured: true,
    inStock: true,
    tags: ['headwear', 'cap', 'essential']
  },
  {
    id: 'prod-a-02',
    slug: 'heavy-canvas-tote',
    name: 'Heavy Canvas Tote',
    category: 'accessories',
    subcategory: 'bags',
    price: 1299,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773163439/Screenshot_from_2026-03-10_22-53-40_gqlzgh.png',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['OS'],
    colors: [{ name: 'Natural', hex: '#F5F5DC' }],
    description: 'An oversized everyday tote bag made from virtually indestructible 16oz cotton canvas. Features a reinforced base, an internal zip pocket for valuables, and contrasting black shoulder straps.',
    shortDescription: 'Oversized 16oz heavy canvas everyday tote bag.',
    material: '100% Cotton Canvas (16oz)',
    fit: 'W: 20" x H: 15" x D: 6"',
    careInstructions: ['Spot clean only'],
    features: ['Internal zip pocket', 'Reinforced base', 'Large capacity'],
    rating: 4.9,
    reviewCount: 155,
    isNew: true,
    isFeatured: false,
    inStock: true,
    tags: ['bag', 'tote', 'utility']
  },
  {
    id: 'prod-a-03',
    slug: 'distressed-dad-hat',
    name: 'Distressed Dad Hat',
    category: 'accessories',
    subcategory: 'caps',
    price: 799,
    comparePrice: 999,
    discount: 20,
    images: [
      'https://res.cloudinary.com/dstmv07tf/image/upload/v1773163363/Screenshot_from_2026-03-10_22-52-20_hkmvyb.png',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['OS'],
    colors: [{ name: 'Faded Khaki', hex: '#C3B091' }],
    description: 'A 6-panel unstructured dad cap constructed from washed twill with hand-distressed detailing on the brim. Features a low-key embroidered logo and an antique brass buckle.',
    shortDescription: '6-panel unstructured washed twill cap with distressing.',
    material: '100% Cotton Twill',
    fit: 'One Size Fits All (Adjustable)',
    careInstructions: ['Hand wash cold'],
    features: ['Hand-distressed brim', 'Antique brass buckle', 'Low profile'],
    rating: 4.4,
    reviewCount: 42,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['headwear', 'cap', 'vintage']
  },
  {
    id: 'prod-a-04',
    slug: 'crew-socks-3-pack',
    name: 'Logo Crew Socks (3-Pack)',
    category: 'accessories',
    subcategory: 'socks',
    price: 699,
    images: [
      'https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586350977287-f8313460df64?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572913506450-93a0d1a47318?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S/M', 'L/XL'],
    colors: [{ name: 'Multi', hex: '#FFFFFF' }],
    description: 'A 3-pack of premium thick ribbed crew socks featuring terry-cushioned soles for maximum comfort. Engineered arch support and jacquard knitted logo detailing.',
    shortDescription: 'Thick ribbed crew socks with cushioned soles.',
    material: '80% Cotton, 17% Polyester, 3% Elastane',
    fit: 'True to size',
    careInstructions: ['Machine wash warm', 'Tumble dry low'],
    features: ['Cushioned sole', 'Arch support', '3 pairs included'],
    rating: 4.8,
    reviewCount: 512,
    isNew: false,
    isFeatured: false,
    inStock: true,
    tags: ['socks', 'essential', 'pack']
  },

  // --- NEW ARRIVALS (CROSS-CATEGORY) (4) ---
  {
    id: 'prod-m-09',
    slug: 'nylon-fishing-vest',
    name: 'Nylon Fishing Vest',
    category: 'men',
    subcategory: 'overshirts',
    price: 2899,
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298596-eb5fd3822758?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546215364-12f3fff5d578?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Stone Gorp', hex: '#D2D2C6' }],
    description: 'The ultimate gorpcore layering piece. A lightweight mesh-lined nylon utility vest featuring 8 asymmetrical 3D pockets, D-ring attachments, and an adjustable webbing buckle closure.',
    shortDescription: 'Multi-pocket utilitarian nylon styling vest.',
    material: '100% Nylon Shell, Mesh Lining',
    fit: 'Boxy, cropped layer fit',
    careInstructions: ['Machine wash cold', 'Buckle closures before wash'],
    features: ['8 functional 3D pockets', 'D-ring attachments', 'Webbing buckle closure'],
    rating: 5.0,
    reviewCount: 12,
    isNew: true, // Also appears in new-arrivals tab
    isFeatured: true,
    inStock: true,
    tags: ['gorpcore', 'utility', 'layering']
  },
  {
    id: 'prod-w-09',
    slug: 'sheer-mesh-longsleeve',
    name: 'Sheer Mesh Longsleeve',
    category: 'women',
    subcategory: 'crop tops',
    price: 1699,
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616654228946-b3e34b5c731e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Oil Spill Print', hex: '#3B3C36' }],
    description: 'A second-skin sheer mesh longsleeve featuring an abstract all-over print. Features extended sleeves and lettuce-edge hems. Best worn layered over a bralette.',
    shortDescription: 'Second-skin sheer mesh top with abstract print.',
    material: '95% Polyester, 5% Elastane Mesh',
    fit: 'Second-skin skin-tight fit',
    careInstructions: ['Hand wash cold', 'Lay flat to dry', 'Snag hazard'],
    features: ['All-over abstract print', 'Lettuce edge hem', 'Extended sleeves'],
    rating: 4.5,
    reviewCount: 22,
    isNew: true, // Also appears in new-arrivals tab
    isFeatured: false,
    inStock: true,
    tags: ['mesh', 'print', 'layering']
  },
  {
    id: 'prod-m-10',
    slug: 'heavy-canvas-work-jacket',
    name: 'Heavy Canvas Work Jacket',
    category: 'men',
    subcategory: 'overshirts',
    price: 5499,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520975954732-57ec0440b63b?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Tobacco Brown', hex: '#714E3D' }],
    description: 'A rugged workwear staple re-engineered for the street. Crafted from 14oz brushed cotton canvas with a heavy quilt lining. Features a contrast corduroy collar and triple-stitched seams.',
    shortDescription: 'Rugged 14oz canvas work jacket with corduroy collar.',
    material: '100% Cotton Canvas (14oz), Polyester Quilt Lining',
    fit: 'Oversized boxy fit',
    careInstructions: ['Dry clean only'],
    features: ['Contrast corduroy collar', 'Quilt insulation', 'Triple-stitched seams'],
    rating: 4.9,
    reviewCount: 45,
    isNew: true, // Also appears in new-arrivals tab
    isFeatured: true,
    inStock: true,
    tags: ['workwear', 'jacket', 'outerwear']
  },
  {
    id: 'prod-w-10',
    slug: 'slouchy-knitted-sweater',
    name: 'Slouchy Knitted Sweater',
    category: 'women',
    subcategory: 'hoodies', // closest match
    price: 3299,
    comparePrice: 3899,
    discount: 15,
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
    ],
    sizes: ['S/M', 'L/XL'],
    colors: [{ name: 'Oatmeal', hex: '#E6D7C3' }],
    description: 'The knitwear you\'ll live in this winter. A severely oversized, chunky knit pullover sweater with dropped shoulders, exaggerated balloon sleeves, and a deep V-neckline. Features intentional ladders/distressing at the hem and cuffs.',
    shortDescription: 'Chunky oversized distressed knit sweater.',
    material: '60% Cotton, 40% Acrylic',
    fit: 'Extremely oversized slouchy fit',
    careInstructions: ['Hand wash cold', 'Dry flat', 'Do not hang (will stretch)'],
    features: ['Distressed hemlines', 'Balloon sleeves', 'Deep V-neck'],
    rating: 4.7,
    reviewCount: 88,
    isNew: true, // Also appears in new-arrivals
    isFeatured: false,
    inStock: true,
    tags: ['knitwear', 'distressed', 'oversized']
  }
];

// ==========================================
// MOCK REVIEWS
// ==========================================

export const MOCK_REVIEWS: Review[] = [
  { id: 'rev-1', productId: 'prod-m-01', userName: 'Rahul Sharma', rating: 5, title: 'Best hoodie I own', body: 'The quality on this 450gsm hoodie is insane. It falls perfectly and the oversized fit is spot on. Will buy in more colours.', date: '2 weeks ago', isVerifiedPurchase: true, helpfulCount: 14 },
  { id: 'rev-2', productId: 'prod-m-01', userName: 'Kabir D.', rating: 4, title: 'Great but runs very big', body: 'Love the material but definitely size down if you don\'t want an extreme oversized look. I usually wear L but M fits better.', date: '1 month ago', isVerifiedPurchase: true, helpfulCount: 8 },
  { id: 'rev-3', productId: 'prod-w-01', userName: 'Aisha K.', rating: 5, title: 'Perfect basic', body: 'This tank is so thick and sculpting, you don\'t even need a bra underneath. Incredible quality for the price.', date: '3 days ago', isVerifiedPurchase: true, helpfulCount: 22 },
  { id: 'rev-4', productId: 'prod-w-04', userName: 'Priya Patel', rating: 5, title: 'Obsessed with the fit', body: 'The wide leg is EVERYTHING. So dramatic but so comfortable. I literally live in these sweatpants now.', date: '1 week ago', isVerifiedPurchase: true, helpfulCount: 5 },
  { id: 'rev-5', productId: 'prod-m-04', userName: 'Samir V.', rating: 4, title: 'Solid tech jacket', body: 'Great for the monsoon. Zips are high quality. Only giving 4 stars because the hood could be a bit larger.', date: '2 months ago', isVerifiedPurchase: true, helpfulCount: 2 },
  { id: 'rev-6', productId: 'prod-a-02', userName: 'Neha Singh', rating: 5, title: 'Indestructible bag', body: 'I use this for college and it carries my laptop, books, gym clothes, everything. The canvas is so thick it stands up on its own.', date: '3 weeks ago', isVerifiedPurchase: true, helpfulCount: 11 }
];



// ==========================================
// MOCK WISHLIST
// ==========================================

export const MOCK_WISHLIST_IDS: string[] = ['prod-m-01', 'prod-w-04', 'prod-m-09'];
