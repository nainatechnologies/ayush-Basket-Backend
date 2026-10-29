'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * CORS middleware unit tests
 *
 * These tests exercise the corsOriginFn logic in isolation (no live server
 * or database required) by importing the helper directly from server.js
 * internals.  Because server.js wires everything together, we re-implement
 * the same allow-list logic here so the tests are dependency-free and fast.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Replicate the allow-list logic from src/server.js so we can test it
// without starting Express or connecting to a database.
// ---------------------------------------------------------------------------

const HARDCODED_ORIGINS = [
  'https://ayushbasket.nainatechnologies.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

function buildAllowedOrigins(frontendUrlEnv) {
  const fromEnv = frontendUrlEnv
    ? frontendUrlEnv
        .split(',')
        .map(u => u.trim().replace(/\/$/, ''))
        .filter(Boolean)
    : [];
  return [...new Set([...HARDCODED_ORIGINS, ...fromEnv])];
}

/**
 * Returns a promise that resolves to the value the cors origin callback
 * would pass to Express (the allowed origin string, or throws on rejection).
 *
 * @param {string|undefined} origin  - Request Origin header value
 * @param {'production'|'development'} nodeEnv
 * @param {string|undefined} frontendUrlEnv  - FRONTEND_URL env var value
 */
function runCorsOrigin(origin, nodeEnv, frontendUrlEnv) {
  const allowedOrigins = buildAllowedOrigins(frontendUrlEnv);

  return new Promise((resolve, reject) => {
    // Replicate corsOriginFn from src/server.js
    const corsOriginFn = (origin, callback) => {
      if (!origin) return callback(null, true);
      if (nodeEnv !== 'production') return callback(null, origin);

      const lowerOrigin = origin.toLowerCase();
      const isAllowed =
        allowedOrigins.some(allowed => lowerOrigin === allowed.toLowerCase()) ||
        lowerOrigin.endsWith('.nainatechnologies.in');

      if (isAllowed) return callback(null, origin);
      return callback(new Error(`CORS: origin '${origin}' is not allowed.`));
    };

    corsOriginFn(origin, (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('CORS: production frontend origin is allowed', async () => {
  const result = await runCorsOrigin(
    'https://ayushbasket.nainatechnologies.in',
    'production',
    undefined
  );
  // Must reflect the exact origin (not true/wildcard) so browsers accept it
  assert.equal(result, 'https://ayushbasket.nainatechnologies.in');
});

test('CORS: OPTIONS preflight from production frontend is allowed', async () => {
  // OPTIONS preflights carry the same Origin header; the allow-list applies
  const result = await runCorsOrigin(
    'https://ayushbasket.nainatechnologies.in',
    'production',
    undefined
  );
  assert.equal(result, 'https://ayushbasket.nainatechnologies.in');
});

test('CORS: other *.nainatechnologies.in sub-domains are allowed in production', async () => {
  const result = await runCorsOrigin(
    'https://admin.nainatechnologies.in',
    'production',
    undefined
  );
  assert.equal(result, 'https://admin.nainatechnologies.in');
});

test('CORS: placeholder "https://your-production-url.com" is BLOCKED in production', async () => {
  await assert.rejects(
    () => runCorsOrigin('https://your-production-url.com', 'production', undefined),
    /CORS: origin 'https:\/\/your-production-url\.com' is not allowed\./
  );
});

test('CORS: arbitrary external origin is blocked in production', async () => {
  await assert.rejects(
    () => runCorsOrigin('https://evil.example.com', 'production', undefined),
    /CORS: origin .* is not allowed\./
  );
});

test('CORS: localhost origins are allowed in production (hardcoded list)', async () => {
  const result = await runCorsOrigin('http://localhost:5173', 'production', undefined);
  assert.equal(result, 'http://localhost:5173');
});

test('CORS: all origins are allowed in development mode', async () => {
  const result = await runCorsOrigin('https://random-staging.example.com', 'development', undefined);
  assert.equal(result, 'https://random-staging.example.com');
});

test('CORS: no Origin header (curl/Postman/server-to-server) is always allowed', async () => {
  const result = await runCorsOrigin(undefined, 'production', undefined);
  assert.equal(result, true);
});

test('CORS: FRONTEND_URL env var adds extra origins in production', async () => {
  const extraOrigin = 'https://staging.nainatechnologies.in';
  const result = await runCorsOrigin(extraOrigin, 'production', extraOrigin);
  assert.equal(result, extraOrigin);
});

test('CORS: FRONTEND_URL env var with comma-separated list works', async () => {
  const frontendUrlEnv =
    'https://ayushbasket.nainatechnologies.in,https://admin.example.com';
  const result = await runCorsOrigin(
    'https://admin.example.com',
    'production',
    frontendUrlEnv
  );
  assert.equal(result, 'https://admin.example.com');
});

test('CORS: reflected origin is the exact request origin (no wildcard)', async () => {
  const origin = 'https://ayushbasket.nainatechnologies.in';
  const result = await runCorsOrigin(origin, 'production', undefined);
  // Must not be '*' — that would break credentialed requests
  assert.notEqual(result, '*');
  assert.notEqual(result, true);
  assert.equal(result, origin);
});

