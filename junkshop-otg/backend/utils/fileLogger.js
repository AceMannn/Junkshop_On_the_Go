const fs = require('fs');
const path = require('path');
const util = require('util');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'storage', 'logs');
const LOG_FILE = process.env.LOG_FILE || path.join(LOG_DIR, 'laravel.log');

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|authorization|api[_-]?key|mongo[_-]?uri|jwt|credential/i;

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function redact(value) {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : redact(nestedValue),
      ])
    );
  }

  return value;
}

function serializeContext(context = {}) {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  return ` ${util.inspect(redact(context), {
    breakLength: Infinity,
    compact: true,
    depth: 6,
  })}`;
}

function write(level, message, context = {}) {
  try {
    ensureLogDir();
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] local.${level}: ${message}${serializeContext(context)}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (error) {
    // Logging must never break the request path.
    console.warn('[file-logger]', error.message);
  }
}

function error(message, err, context = {}) {
  const errorContext = err
    ? {
        ...context,
        error: {
          name: err.name,
          message: err.message,
          code: err.code,
          status: err.status,
          stack: err.stack,
        },
      }
    : context;

  write('ERROR', message, errorContext);
}

module.exports = {
  info: (message, context) => write('INFO', message, context),
  warn: (message, context) => write('WARNING', message, context),
  error,
};
