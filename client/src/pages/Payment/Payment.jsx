import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { plan = 'pro', cycle = 'monthly' } = location.state || { plan: 'pro', cycle: 'monthly' };
  const [loading, setLoading] = useState(false);

  const prices = {
    pro: { monthly: 299, yearly: 2870 },
    premium: { monthly: 599, yearly: 5750 },
  };
  const price = prices[plan]?.[cycle] || 299;
  const gst = price * 0.18;
  const total = price + gst;

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order on backend
      const { data } = await api.post('/billing/create-order', { plan, billingCycle: cycle });
      const { orderId, amount, currency, key } = data;

      // 2. Load Razorpay script if not already
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      // 3. Configure Razorpay options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'MockMate',
        description: `${plan.toUpperCase()} Plan - ${cycle}`,
        order_id: orderId,
        handler: async function (response) {
          // 4. Verify payment on backend
          const verifyRes = await api.post('/billing/verify', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            plan
          });
          if (verifyRes.data.success) {
            showToast(`Payment successful! Your plan is now ${plan.toUpperCase()}`, 'success');
            await api.put('/user/update-plan', { plan });   // <-- YEH LINE ADD KAR
            const currUser = JSON.parse(localStorage.getItem('mockmate_user'));
            currUser.plan = plan;
            localStorage.setItem('mockmate_user', JSON.stringify(currUser));
            navigate('/profile/setup');
          } else {
            showToast('Payment verification failed', 'error');
          }
        },
        prefill: {
          name: 'MockMate User',
          email: 'user@example.com'
        },
        theme: {
          color: '#7c3aed'
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      showToast('Payment initiation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full bg-[#13131a] border border-[#2d2d3d] rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-bold shadow-lg mb-4 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay ₹${Math.round(total)} via Razorpay`}
            </button>
            <p className="text-xs text-[#6b7280] text-center">
              🔒 Test mode – Use card 4111 1111 1111 1111 (any future expiry, any CVV)
            </p>
            <button
              onClick={() => navigate('/plans')}
              className="w-full mt-4 text-[#9ca3af] text-sm underline"
            >
              ← Cancel & back to plans
            </button>
          </div>
          <div className="w-full md:w-80 bg-[#0f0f15] p-8 border-t md:border-l border-[#2d2d3d]">
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9ca3af] capitalize">{plan} Plan ({cycle})</span>
                <span>₹{price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">GST (18%)</span>
                <span>₹{Math.round(gst)}</span>
              </div>
              <div className="border-t border-[#2d2d3d] my-2"></div>
              <div className="flex justify-between font-bold text-white">
                <span>Total</span>
                <span>₹{Math.round(total)}</span>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-green-400">✅ Test mode – no real money</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;