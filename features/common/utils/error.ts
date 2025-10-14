// common/utils/error.ts

export function formatError({ message, code, cause = null }) {
    return {
      error: true,
      message,
      code,
      cause,
      traceId: `ERR-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  }
  