function setDefaultEnv(name: string, value: string) {
  if (!process.env[name]) {
    process.env[name] = value;
  }
}

setDefaultEnv("NODE_ENV", "test");
setDefaultEnv("JWT_SECRET", "test-jwt-secret-123456");
setDefaultEnv("MAIL_FROM", "tests@edebatte.local");
setDefaultEnv("SMTP_FROM", "tests@edebatte.local");
setDefaultEnv("CORE_DB_NAME", "edebatte_test_core");
setDefaultEnv("CORE_MONGODB_URI", "mongodb://127.0.0.1:27017/edebatte_test_core");
setDefaultEnv("VOTES_DB_NAME", "edebatte_test_votes");
setDefaultEnv("VOTES_MONGODB_URI", "mongodb://127.0.0.1:27017/edebatte_test_votes");
setDefaultEnv("PII_DB_NAME", "edebatte_test_pii");
setDefaultEnv("PII_MONGODB_URI", "mongodb://127.0.0.1:27017/edebatte_test_pii");
setDefaultEnv("AI_CORE_READER_DB_NAME", "edebatte_test_ai_core_reader");
setDefaultEnv("AI_CORE_READER_MONGODB_URI", "mongodb://127.0.0.1:27017/edebatte_test_ai_core_reader");
setDefaultEnv("PUBLIC_ID_SALT", "public-id-salt-123456");
setDefaultEnv("NEXTAUTH_SECRET", "nextauth-secret-123456");
setDefaultEnv("NEO4J_URI", "bolt://127.0.0.1:7687");
setDefaultEnv("NEO4J_USER", "neo4j");
setDefaultEnv("NEO4J_PASSWORD", "test-password");
setDefaultEnv("ARANGO_URL", "http://127.0.0.1:8529");
setDefaultEnv("ARANGO_DB", "edebatte_test_arango");
setDefaultEnv("ARANGO_USER", "root");
setDefaultEnv("ARANGO_ROOT_PASSWORD", "test-password");
setDefaultEnv("MEMGRAPH_URI", "bolt://127.0.0.1:7688");
setDefaultEnv("VITEST", "1");
