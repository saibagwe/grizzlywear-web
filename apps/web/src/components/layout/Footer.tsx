import Link from 'next/link';

const footerLinks = {
  shop: [
    { href: '/shop?category=new-arrivals', label: 'New Arrivals' },
    { href: '/shop?category=men', label: 'Men' },
    { href: '/shop?category=women', label: 'Women' },
    { href: '/shop?category=accessories', label: 'Accessories' },
  ],
  help: [
    { href: '/track', label: 'Track Order' },
    { href: '/account/support', label: 'Contact Us' },
    { href: '#', label: 'Returns Policy' },
    { href: '#', label: 'Size Guide' },
  ],
  company: [
    { href: '#', label: 'About Us' },
    { href: '#', label: 'Careers' },
    { href: '#', label: 'Press' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-lg sm:text-xl font-medium tracking-[0.2em] uppercase mb-3">
              Stay in the Wild
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Subscribe for new drops, exclusive offers, and 10% off your first order.
            </p>
            <form className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border border-white/20 rounded-none px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-black px-6 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-gray-200 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="text-lg font-bold tracking-[0.3em] uppercase"
            >
              GRIZZLYWEAR
            </Link>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Premium fashion for the fearless.
              <br />
              Made in India. Worn worldwide.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://instagram.com/grizzlywear"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://wa.me/917304967959"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm"
                aria-label="WhatsApp"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs tracking-[0.2em] uppercase font-medium mb-4 text-gray-300">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Grizzlywear®. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            contact@grizzlywear.in | +91 7304967959
          </p>
        </div>
      </div>
    </footer>
  );
}
