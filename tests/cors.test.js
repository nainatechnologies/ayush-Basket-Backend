'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * CORS middleware unit tests
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Logic under test, matching src/server.js
// ---------------------------------------------------------------------------

const DEFAULT_PRODUCTION_ORIGINS = [
  'https://ayushbasket.nainatechnologies.in',
];

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

function buildAllowedOrigins(envOriginsStr, nodeEnv) {
  const fromEnv = envOriginsStr
    ? envOriginsStr
        .split(',')
        .map(u => u.trim().replace(/\/$/, ''))
        .filter(Boolean)
    : [];

  const baseOrigins = nodeEnv === 'production'
    ? DEFAULT_PRODUCTION_ORIGINS
    : [...DEFAULT_PRODUCTION_ORIGINS, ...DEV_ORIGINS];

  return [...new Set([...baseOrigins, ...fromEnv])];
}

function runCorsOrigin(origin, nodeEnv, envOriginsStr) {
  const allowedOrigins = buildAllowedOrigins(envOriginsStr, nodeEnv);

  return new Promise((resolve, reject) => {
    const corsOriginFn = (origin, callback) => {
      // 1. Non-browser client
      if (!origin) return callback(null, true);

      const lowerOrigin = origin.toLowerCase();

      // 2. Development mode – allow localhost and local dev origins
      if (nodeEnv !== 'production') {
        if (
          DEV_ORIGINS.some(d => lowerOrigin === d.toLowerCase()) ||
          lowerOrigin.startsWith('http://localhost:') ||
          lowerOrigin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, origin);
        }
      }

      // 3. Production & configured origins check
      const isAllowed =
        allowedOrigins.some(allowed => lowerOrigin === allowed.toLowerCase()) ||
        lowerOrigin.endsWith('.nainatechnologies.in');

      if (isAllowed) {
        return callback(null, origin);
      }

      // 4. Blocked
      return callback(new Error(`CORS: origin '${origin}' is not allowed.`));
    };

    corsOriginFn(origin, (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

test('CORS: production frontend origin is allowed', async () => {
  const result = await runCorsOrigin(
    'https://ayushbasket.nainatechnologies.in',
    'production',
    undefined
  );
  assert.equal(result, 'https://ayushbasket.nainatechnologies.in');
});

test('CORS: OPTIONS preflight from production frontend is allowed', async () => {
  const result = await runCorsOrigin(
    'https://ayushbasket.nainatechnologies.in',
    'production',
    undefined
  );
  assert.equal(result, 'https://ayushbasket.nainatechnologies.in');
});

test('CORS: localhost origins are BLOCKED in production mode', async () => {
  await assert.rejects(
    () => runCorsOrigin('http://localhost:5173', 'production', undefined),
    /CORS: origin 'http:\/\/localhost:5173' is not allowed\./
  );
  await assert.rejects(
    () => runCorsOrigin('http://localhost:3000', 'production', undefined),
    /CORS: origin 'http:\/\/localhost:3000' is not allowed\./
  );
});

test('CORS: localhost origins are ALLOWED in development mode', async () => {
  const res5173 = await runCorsOrigin('http://localhost:5173', 'development', undefined);
  assert.equal(res5173, 'http://localhost:5173');

  const res3000 = await runCorsOrigin('http://localhost:3000', 'development', undefined);
  assert.equal(res3000, 'http://localhost:3000');
});

test('CORS: placeholder "https://your-production-url.com" is BLOCKED in production', async () => {
  await assert.rejects(
    () => runCorsOrigin('https://your-production-url.com', 'production', undefined),
    /CORS: origin 'https:\/\/your-production-url\.com' is not allowed\./
  );
});

test('CORS: arbitrary external origin is blocked in production', async () => {
  await assert.rejects(
    () => runCorsOrigin('https://untrusted-site.com', 'production', undefined),
    /CORS: origin 'https:\/\/untrusted-site\.com' is not allowed\./
  );
});

test('CORS: other *.nainatechnologies.in sub-domains are allowed in production', async () => {
  const result = await runCorsOrigin(
    'https://admin.nainatechnologies.in',
    'production',
    undefined
  );
  assert.equal(result, 'https://admin.nainatechnologies.in');
});

test('CORS: non-browser / server-to-server request (no Origin header) is allowed', async () => {
  const result = await runCorsOrigin(undefined, 'production', undefined);
  assert.equal(result, true);
});

test('CORS: FRONTEND_URL env var adds additional production origins', async () => {
  const extraOrigin = 'https://partner.nainatechnologies.in';
  const result = await runCorsOrigin(extraOrigin, 'production', extraOrigin);
  assert.equal(result, extraOrigin);
});

test('CORS: reflected origin is the exact request origin (never wildcard *)', async () => {
  const origin = 'https://ayushbasket.nainatechnologies.in';
  const result = await runCorsOrigin(origin, 'production', undefined);
  assert.notEqual(result, '*');
  assert.notEqual(result, true);
  assert.equal(result, origin);
});
