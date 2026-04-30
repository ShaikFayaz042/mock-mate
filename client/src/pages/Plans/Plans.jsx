import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';   // ✅ add this import
import { useToast } from '../../context/ToastContext'; // optional

const Plans = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const { showToast } = useToast(); // if you want toasts

  const handleSelectPlan = async (planType) => {
    if (planType === 'free') {
      try {
        await api.put('/user/update-plan', { plan: 'free' });
        showToast('Free plan activated!', 'success');
        navigate('/profile/setup');
      } catch (err) {
        showToast('Failed to activate plan', 'error');
      }
    } else {
      // Pro or Premium: redirect to payment page
      navigate('/payment', { state: { plan: planType, cycle: billingCycle } });
    }
  };

  const plans = {
    free: {
      name: 'FREE',
      priceMonthly: '₹0',
      priceYearly: '₹0',
      features: [
        '✓ 100 credits total',
        '✓ Text-based interviews only',
        '✓ Basic AI feedback',
        '✓ Max 5 interviews',
        '✗ No report download',
      ],
      buttonText: 'Get Started Free',
      popular: false,
    },
    pro: {
      name: 'PRO',
      priceMonthly: '₹299',
      priceYearly: '₹2870',
      features: [
        '✓ Unlimited credits',
        '✓ All modes — Text, Voice, Video',
        '✓ Full AI feedback + Confidence Score',
        '✓ Unlimited interviews',
        '✓ Report download (PDF)',
        '✓ Resume-based interviews',
      ],
      buttonText: 'Upgrade to Pro',
      popular: true,
    },
    premium: {
      name: 'PREMIUM',
      priceMonthly: '₹599',
      priceYearly: '₹5750',
      features: [
        '✓ Everything in Pro',
        '✓ Priority AI (faster responses)',
        '✓ Industry-specific question bank',
        '✓ LinkedIn profile analysis',
        '✓ Detailed roadmap generation',
      ],
      buttonText: 'Go Premium',
      popular: false,
    },
  };

  const getPrice = (plan) => {
    if (billingCycle === 'monthly') return plan.priceMonthly;
    return plan.priceYearly;
  };

  const getPer = () => {
    return billingCycle === 'monthly' ? '/month' : '/year';
  };


  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-[#9ca3af] mt-4 text-lg">
            Start free, upgrade anytime. No hidden fees.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition ${billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white'
                : 'text-[#9ca3af] hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition ${billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white'
                : 'text-[#9ca3af] hover:text-white'
                }`}
            >
              Yearly <span className="text-xs text-green-400 ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Object.keys(plans).map((planKey) => {
            const plan = plans[planKey];
            return (
              <div
                key={planKey}
                className={`relative bg-[#13131a] border rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${plan.popular
                  ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                  : 'border-[#2d2d3d] hover:border-purple-500'
                  }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      {getPrice(plan)}
                    </span>
                    <span className="text-[#9ca3af] ml-1">{getPer()}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`text-sm ${feature.startsWith('✓') ? 'text-green-400' : 'text-[#6b7280]'
                        }`}
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(planKey)}
                  className={`w-full py-2 rounded-lg font-semibold transition ${plan.popular
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                    : 'border border-purple-500 text-purple-400 hover:bg-purple-500/10'
                    }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-[#6b7280] text-sm mt-12">
          All plans include free updates and community support. No credit card required for Free plan.
        </p>

        {/* Back to dashboard link (optional) */}
        <div className="text-center mt-6">
          <Link to="/" className="text-purple-400 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Plans;