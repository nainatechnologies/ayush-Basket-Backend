const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { MockRazorpay, generateMockSignature } = require('../src/modules/payment/payment.mock');

test('Mock Razorpay creates order successfully', async () => {
  const rzp = new MockRazorpay({ key_id: 'test', key_secret: 'secret' });
  const order = await rzp.orders.create({ amount: 50000, currency: 'INR', receipt: 'rcpt_1' });
  
  assert.strictEqual(order.amount, 50000);
  assert.strictEqual(order.status, 'created');
  assert.ok(order.id.startsWith('order_mock_'));
});

test('Mock Signature verification matches generated signature', () => {
  const orderId = 'order_mock_123';
  const paymentId = 'pay_mock_123';
  const secret = 'test_secret';

  const signature = generateMockSignature(orderId, paymentId, secret);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(orderId + "|" + paymentId);
  const expectedSignature = hmac.digest('hex');

  assert.strictEqual(signature, expectedSignature);
});

test('Webhook signature validation simulation', () => {
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123' } } }
  });

  const secret = 'webhook_secret';
  const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const invalidSignature = crypto.createHmac('sha256', secret).update(payload + 'x').digest('hex');

  assert.strictEqual(validSignature === invalidSignature, false);
});
