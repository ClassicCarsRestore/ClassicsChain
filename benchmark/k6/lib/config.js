export const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
export const KRATOS_PUBLIC_URL =
  __ENV.KRATOS_PUBLIC_URL || "http://localhost:4433";
export const HYDRA_PUBLIC_URL =
  __ENV.HYDRA_PUBLIC_URL || "http://localhost:4444";

export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL;
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD;

// Pre-configured tokens (skip Kratos/Hydra admin calls for remote environments)
export const SESSION_TOKEN = __ENV.SESSION_TOKEN;
export const OAUTH2_TOKEN = __ENV.OAUTH2_TOKEN;
export const ENTITY_ID = __ENV.ENTITY_ID;
