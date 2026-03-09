'use client';

export default function CartPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="heading-md mb-8">Shopping Bag</h1>

        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2">
            {/* Empty state */}
            <div className="text-center py-20 border border-dashed border-gray-200">
              <p className="text-gray-400 mb-4">Your bag is empty</p>
              <a href="/shop" className="btn-primary inline-block">
                Continue Shopping
              </a>
            </div>
          </div>

          {/* Order summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-gray-50 p-6 sticky top-24">
              <h2 className="label text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-400">Calculated at checkout</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>₹0</span>
                </div>
              </div>
              <button
                disabled
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
