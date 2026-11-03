'use strict';

/**
 * AyushBasket E-Commerce Backend
 * CORS allow-list and middleware options.
 *
 * Kept in its own module so the exact behaviour used by the server can be
 * unit-tested without starting Express or opening a database connection.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://ayushbasket.nainatechnologies.in',
  'https://ayushadmin.nainatechnologies.in',
  'https://ayushbasket.com',
  'https://www.ayushbasket.com'
];

// Older deployments shipped this placeholder as the *effective* CORS origin,
// which made every browser request fail. Never trust it, even if it is present
// in an environment variable.
const PLACEHOLDER_ORIGINS = new Set([
  'https://your-production-url.com',
  'http://your-production-url.com'
]);

// Matches http(s)://localhost:<port>, http://127.0.0.1:<port> and http://[::1]:<port>
const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const normalizeOrigin = value =>
  String(value || '')
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase();

/**
 * Normalise one or more comma-separated origin lists (usually env vars).
 * Placeholder values are stripped so they can never become the ACAO header.
 */
function parseOriginList(...values) {
  return values
    .join(',')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
    .filter(origin => !PLACEHOLDER_ORIGINS.has(origin));
}

/**
 * Build the CORS allow-list and `cors` middleware options.
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {{ warn: Function }} logger
 */
function buildCorsConfig(env = process.env, logger = console) {
  const configuredOrigins = parseOriginList(
    env.FRONTEND_URL,
    env.CORS_ORIGIN,
    env.DEV_ORIGINS
  );

  const allowedOrigins = new Set(
    [...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins].map(normalizeOrigin)
  );

  const isProduction = env.NODE_ENV === 'production';
  const allowLocalhostByFlag =
    String(env.ENABLE_LOCALHOST_CORS || '').toLowerCase() === 'true';

  const origin = (requestOrigin, callback) => {
    // Requests without an Origin header (curl, Postman, server-to-server) are
    // not browser cross-origin requests.
    if (!requestOrigin) {
      return callback(null, true);
    }

    const lower = normalizeOrigin(requestOrigin);

    // 1. Exact allow-list (default domains + anything configured in env).
    if (allowedOrigins.has(lower)) {
      return callback(null, requestOrigin);
    }

    // 2. First-party domains and their sub-domains.
    if (
      lower.endsWith('.nainatechnologies.in') ||
      lower.endsWith('.ayushbasket.com')
    ) {
      return callback(null, requestOrigin);
    }

    // 3. Local development. Allowed automatically outside production, or in
    //    production when ENABLE_LOCALHOST_CORS=true (useful while developing a
    //    local frontend against the deployed API).
    if (
      (!isProduction || allowLocalhostByFlag) &&
      LOCAL_ORIGIN_PATTERN.test(lower)
    ) {
      return callback(null, requestOrigin);
    }

    logger.warn(`[CORS] Rejected origin: ${requestOrigin}`);
    return callback(null, false);
  };

  return {
    allowedOrigins,
    corsOptions: {
      origin,
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      optionsSuccessStatus: 204
    }
  };
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  PLACEHOLDER_ORIGINS,
  LOCAL_ORIGIN_PATTERN,
  normalizeOrigin,
  parseOriginList,
  buildCorsConfig
};
