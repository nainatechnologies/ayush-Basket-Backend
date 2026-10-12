# AyushBasket Backend API

AyushBasket is an Ayurvedic & Homeopathic e-commerce platform backend built on Node.js, Express, and MySQL (Sequelize).

---

## 🛠️ Tech Stack
- **Runtime & Framework:** Node.js (v18+), Express.js
- **Database & ORM:** MySQL with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **SMS Gateway:** Twilio Node.js Server SDK
- **Payment Gateway:** Razorpay
- **File Uploads:** Cloudinary / Local Multer

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.0.0
- MySQL Server >= 8.0

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your database credentials and optional service keys.

### 3. Installation & Database Setup
```bash
npm install
node scripts/setup.js
node scripts/seedAdmin.js
```

### 4. Running the Development Server
```bash
npm run dev
```

---

## 📱 SMS & Twilio Integration

AyushBasket integrates server-side SMS via the official Twilio SDK for critical transactional and authentication workflows.

### Supported SMS Notifications
1. **Order Placed Confirmation (`ORDER_PLACED`):** Sent to customer after an order is successfully created or online payment is verified.
2. **Order Accepted / Confirmed (`ORDER_ACCEPTED`):** Sent when admin accepts/confirms the order for dispatch.
3. **Order Completed / Delivered (`ORDER_COMPLETED`):** Thank-you and delivery confirmation sent strictly once upon completion.
4. **Registration OTP:** Sent during customer registration (6-digit code, valid 10 minutes). Supports direct Twilio SMS or Twilio Verify.
5. **Forgot Password OTP:** Sent when requesting a password reset (non-enumerating, valid 10 minutes). Supports direct Twilio SMS or Twilio Verify.

---

### Environment Variables Reference

| Variable | Required / Optional | Description | Placeholder Example |
|---|---|---|---|
| `SMS_ENABLED` | Required | Set `true` for live delivery; `false` for mock/dev mode | `false` |
| `TWILIO_ACCOUNT_SID` | Required | Twilio Account SID from Console | `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `TWILIO_AUTH_TOKEN` | Auth Option A | Twilio Auth Token from Console | `your_twilio_auth_token_here` |
| `TWILIO_API_KEY` | Auth Option B | Twilio API Key SID | `SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `TWILIO_API_SECRET` | Auth Option B | Twilio API Key Secret | `your_twilio_api_secret_here` |
| `TWILIO_MESSAGING_SERVICE_SID` | Sender Option 1 | Recommended: Twilio Messaging Service SID | `MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `TWILIO_PHONE_NUMBER` | Sender Option 2 | Active Twilio Phone Number in E.164 format | `+1XXXXXXXXXX` |
| `TWILIO_VERIFY_SERVICE_SID` | Optional | Twilio Verify Service SID (if using Twilio Verify for OTPs) | `VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `OTP_SECRET` | Recommended | Pepper used for HMAC-SHA256 OTP hashing in database | `your_otp_secret_key` |

---

### Security & Resilience Features
- **Server-Side Only:** Twilio credentials and actions are strictly server-side. No credentials exist in client code.
- **Zero Plaintext Storage:** OTPs are never stored in plaintext. They are hashed using HMAC-SHA256 before database insertion.
- **Masked Phone Logging:** Recipient phone numbers are masked in console output (`+91*****4500`). Plaintext OTPs are never logged.
- **Dual Rate Limiting:**
  - `otpRateLimiter`: Limits OTP generation requests to 5 per 10 minutes per IP.
  - `otpVerifyRateLimiter`: Limits verification attempts to 10 per 10 minutes per IP to prevent brute-force attacks.
- **E.164 Normalization:** Recipient phone numbers are automatically sanitized and normalized to E.164 format (`+91XXXXXXXXXX`).
- **Duplicate Prevention:** Order notifications use unique database constraints (`order_notifications`) to prevent duplicate triggers on retries or status resaves.
- **Fault Tolerance:** SMS delivery errors are caught non-fatally; an SMS network glitch will never rollback an order creation or admin status update.

---

## 🇮🇳 India SMS Compliance & Twilio Console Setup

If sending SMS to Indian mobile numbers (`+91`):

1. **Purchased US/International Number Note:**
   * A standard US (+1) long-code phone number purchased in Twilio often cannot reliably deliver transactional SMS to Indian numbers due to Indian telecom carrier spam filters and international SMS restrictions.
   * In the Twilio Console under **Messaging > Settings > Geo-Permissions**, verify that **India (+91)** is enabled for outbound SMS.

2. **Twilio Trust Hub & KYC (Error 20003 Prevention):**
   * Before sending live outbound SMS, Twilio requires an approved **Primary Customer Profile** in the Twilio Console under **Trust Hub > Customer Profiles**.

3. **DLT (Distributed Ledger Technology) Compliance in India:**
   * The Telecom Regulatory Authority of India (TRAI) mandates that domestic commercial/transactional SMS must be registered through an Indian telecom DLT portal (e.g., Vilpower, Jio, Airtel, Vodafone DLT).
   * **Required DLT Components:**
     - Principal Entity (PE) Registration ID
     - Approved 6-character Header / Sender ID (e.g., `AYUSHK`)
     - Registered Content Templates with unique Template IDs
   * In Twilio Console, configure your DLT Entity ID and Template IDs under **Messaging > Regulatory Compliance > India DLT**.

4. **Twilio Verify as an Alternative for OTPs:**
   * If you configure a **Twilio Verify Service** (`TWILIO_VERIFY_SERVICE_SID=VA...`), Twilio Verify automatically handles international carrier compliance and OTP deliverability routing for Indian numbers without requiring individual template registration.

---

## 🧪 Testing

Run the automated test suite:
```bash
node --test tests/*.test.js
```
All SMS tests mock Twilio; no live SMS credits are consumed.
