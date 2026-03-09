import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Order',
  description: 'Track your Grizzlywear order status and shipping.',
};

export default function TrackPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="heading-md mb-4">Track Your Order</h1>
        <p className="text-sm text-gray-500 mb-8">
          Enter your order ID to check the delivery status
        </p>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Order ID (e.g. GW-2024-00123)"
            className="input-field text-center"
          />
          <input
            type="email"
            placeholder="Email address"
            className="input-field text-center"
          />
          <button type="submit" className="btn-primary w-full">
            Track Order
          </button>
        </form>

        {/* Timeline placeholder — Shiprocket integration in Phase 7 */}
        <div className="mt-12 text-sm text-gray-400">
          Order tracking details will appear here
        </div>
      </div>
    </div>
  );
}
