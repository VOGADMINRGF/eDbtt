// packages/core/errors/formatError.ts
export type FormattedError = {
    traceId: string;
    code: string;
    message: string;
    details?: unknown;
  };
  
  export function formatError(code: string, message: string, details?: unknown): FormattedError {
    const traceId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    return { traceId, code, message, details };
  }
  