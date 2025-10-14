// apps/web/src/types/env.d.ts
/// <reference types="node" />
declare namespace NodeJS {
  interface ProcessEnv {
    CORE_DATABASE_URL?: string;
    WEB_DATABASE_URL?: string;
    OPENAI_API_KEY?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    NODE_ENV?: "development" | "test" | "production";
  }
}
