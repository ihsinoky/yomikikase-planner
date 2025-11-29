/**
 * Session configuration constants
 */

// Session expiration time in seconds (24 hours)
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

// Session expiration time in milliseconds
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

// Session cookie name
export const SESSION_COOKIE_NAME = 'admin_session';
