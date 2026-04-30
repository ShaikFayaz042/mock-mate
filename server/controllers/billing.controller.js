const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan prices in paise (INR)
const PLAN_AMOUNTS = {
  pro: 29900,     // ₹299
  premium: 59900  // ₹599
};

exports.getPlans = (req, res) => {
  res.json({
    pro: { amount: 299, currency: 'INR', name: 'Pro Plan' },
    premium: { amount: 599, currency: 'INR', name: 'Premium Plan' }
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { plan, billingCycle } = req.body; // plan: 'pro' or 'premium', billingCycle: 'monthly' or 'yearly'
    const amount = PLAN_AMOUNTS[plan];
    if (!amount) return res.status(400).json({ error: 'Invalid plan' });

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan } = req.body;
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Payment successful – upgrade user plan
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.plan = plan; // 'pro' or 'premium'
    user.creditsRemaining = plan === 'pro' ? 999999 : 999999; // unlimited for paid plans
    await user.save();

    res.json({ success: true, plan: user.plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};