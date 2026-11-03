'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * CORS middleware unit tests.
 * These exercise the real implementation in src/config/cors.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCorsConfig, parseOriginList } = require('../src/config/cors');

const silentLogger = { warn: () => {} };

function resolveOrigin(requestOrigin, env = {}) {
  const { corsOptions } = buildCorsConfig(
    { NODE_ENV: 'production', ...env },
    silentLogger
  );

  return new Promise((resolve, reject) => {
    corsOptions.origin(requestOrigin, (error, value) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

test('CORS: production frontend origin is allowed', async () => {
  const origin = 'https://ayushbasket.nainatechnologies.in';
  assert.equal(await resolveOrigin(origin), origin);
});

test('CORS: OPTIONS preflight from production frontend is allowed', async () => {
  const origin = 'https://ayushbasket.nainatechnologies.in';
  assert.equal(await resolveOrigin(origin), origin);
});

test('CORS: localhost origins are BLOCKED in production mode by default', async () => {
  assert.equal(await resolveOrigin('http://localhost:5173'), false);
  assert.equal(await resolveOrigin('http://localhost:3000'), false);
});

test('CORS: localhost origins are ALLOWED in development mode', async () => {
  assert.equal(
    await resolveOrigin('http://localhost:5173', { NODE_ENV: 'development' }),
    'http://localhost:5173'
  );
  assert.equal(
    await resolveOrigin('http://127.0.0.1:3000', { NODE_ENV: 'development' }),
    'http://127.0.0.1:3000'
  );
});

test('CORS: placeholder "https://your-production-url.com" is BLOCKED as a request origin', async () => {
  assert.equal(await resolveOrigin('https://your-production-url.com'), false);
});

test('CORS: placeholder value in FRONTEND_URL is ignored', async () => {
  const env = {
    FRONTEND_URL: 'https://your-production-url.com,https://ayushbasket.com'
  };

  // The placeholder must not become the reflected origin.
  assert.equal(await resolveOrigin('https://your-production-url.com', env), false);
  // A real origin from the same list still works.
  assert.equal(
    await resolveOrigin('https://ayushbasket.com', env),
    'https://ayushbasket.com'
  );
});

test('CORS: arbitrary external origin is blocked in production', async () => {
  assert.equal(await resolveOrigin('https://untrusted-site.com'), false);
});

test('CORS: look-alike domains containing "ayushbasket" are blocked', async () => {
  assert.equal(await resolveOrigin('https://fake-ayushbasket.com'), false);
  assert.equal(await resolveOrigin('https://ayushbasket.evil.com'), false);
});

test('CORS: other *.nainatechnologies.in sub-domains are allowed in production', async () => {
  const origin = 'https://admin.nainatechnologies.in';
  assert.equal(await resolveOrigin(origin), origin);
});

test('CORS: non-browser / server-to-server request (no Origin header) is allowed', async () => {
  assert.equal(await resolveOrigin(undefined), true);
});

test('CORS: FRONTEND_URL env var adds additional production origins', async () => {
  const origin = 'https://partner.nainatechnologies.in';
  assert.equal(
    await resolveOrigin(origin, { FRONTEND_URL: origin }),
    origin
  );
});

test('CORS: DEV_ORIGINS allows localhost in production', async () => {
  const origin = 'http://localhost:5174';
  assert.equal(await resolveOrigin(origin, { DEV_ORIGINS: origin }), origin);
});

test('CORS: ENABLE_LOCALHOST_CORS=true allows localhost in production', async () => {
  const origin = 'http://localhost:5176';
  assert.equal(
    await resolveOrigin(origin, { ENABLE_LOCALHOST_CORS: 'true' }),
    origin
  );
});

test('CORS: reflected origin is the exact request origin (never wildcard *)', async () => {
  const origin = 'https://ayushbasket.nainatechnologies.in';
  const result = await resolveOrigin(origin);
  assert.notEqual(result, '*');
  assert.notEqual(result, true);
  assert.equal(result, origin);
});

test('CORS: trailing slashes in env values are normalised', () => {
  assert.deepEqual(parseOriginList('https://ayushbasket.com/'), [
    'https://ayushbasket.com'
  ]);
});
