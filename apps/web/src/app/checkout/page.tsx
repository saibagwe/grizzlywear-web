'use client';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="heading-md mb-8">Checkout</h1>

        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          {/* Checkout steps */}
          <div className="lg:col-span-3 space-y-8">
            {/* Step 1: Delivery Address */}
            <section>
              <h2 className="label text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">1</span>
                Delivery Address
              </h2>
              <div className="border border-gray-200 p-6 text-center text-sm text-gray-400">
                Address selection — Phase 6 implementation
              </div>
            </section>

            {/* Step 2: Order Review */}
            <section>
              <h2 className="label text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs">2</span>
                Review Order
              </h2>
              <div className="border border-gray-200 p-6 text-center text-sm text-gray-400">
                Order review — Phase 6 implementation
              </div>
            </section>

            {/* Step 3: Payment */}
            <section>
              <h2 className="label text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs">3</span>
                Payment
              </h2>
              <div className="border border-gray-200 p-6 text-center text-sm text-gray-400">
                Razorpay integration — Phase 6 implementation
              </div>
            </section>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="bg-gray-50 p-6 sticky top-24">
              <h2 className="label text-gray-900 mb-4">Order Summary</h2>
              <div className="text-sm text-gray-400 text-center py-8">
                Cart items will appear here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
