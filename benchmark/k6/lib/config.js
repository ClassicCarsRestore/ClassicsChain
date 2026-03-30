export const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
export const KRATOS_PUBLIC_URL =
  __ENV.KRATOS_PUBLIC_URL || "http://localhost:4433";
export const HYDRA_PUBLIC_URL =
  __ENV.HYDRA_PUBLIC_URL || "http://localhost:4444";

export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL;
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD;

// Pre-configured OAuth2 token (skip Kratos/Hydra setup for remote environments)
export const OAUTH2_TOKEN = __ENV.OAUTH2_TOKEN;
export const ENTITY_ID = __ENV.ENTITY_ID;

// Set VERIFY_ANCHORING=true to poll events in teardown until they reach "anchored"
export const VERIFY_ANCHORING = __ENV.VERIFY_ANCHORING === "true";
