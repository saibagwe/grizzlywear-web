import Link from 'next/link';

const footerLinks = {
  shop: [
    { href: '/shop?category=men', label: 'Men' },
    { href: '/shop?category=women', label: 'Women' },
    { href: '/shop?category=accessories', label: 'Accessories' },
    { href: '/shop?category=new-arrivals', label: 'New Arrivals' },
  ],
  help: [
    { href: '/track', label: 'Track Order' },
    { href: '#', label: 'Returns Policy' },
    { href: '#', label: 'Size Guide' },
    { href: '/account/support', label: 'Support' },
    { href: '/#', label: 'FAQ' },
  ],
  company: [
    { href: '#', label: 'About Us' },
    { href: '#', label: 'Careers' },
    { href: '#', label: 'Contact' },
    { href: '#', label: 'Press' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16 sm:py-24 border-t border-white/10 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-16 lg:mb-24">
          
          {/* Brand Info */}
          <div className="w-full lg:w-1/3">
            <Link href="/" className="inline-block text-2xl font-bold tracking-[0.3em] uppercase mb-4 text-white hover:text-gray-300 transition-colors">
              GRIZZLYWEAR
            </Link>
            <p className="text-gray-400 text-sm tracking-widest uppercase mb-8">Wear the Wild</p>
            
            <div className="flex gap-6">
              <a href="https://www.instagram.com/grizzlywear.in/" target="_blank" rel="noreferrer" className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline">
                Instagram
              </a>
              <a href="https://wa.me/917304967959" target="_blank" rel="noreferrer" className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline">
                WhatsApp
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="w-full lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs tracking-[0.2em] uppercase font-bold mb-6 text-white">
                  {title}
                </h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10 text-xs text-gray-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Grizzlywear®. All rights reserved.</p>
          <p>Made in India 🇮🇳</p>
        </div>

      </div>
    </footer>
  );
}
