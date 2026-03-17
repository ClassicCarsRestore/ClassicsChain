import http from "k6/http";
import { check } from "k6";
import encoding from "k6/encoding";
import {
  KRATOS_PUBLIC_URL,
  HYDRA_PUBLIC_URL,
  BASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SESSION_TOKEN,
  OAUTH2_TOKEN,
  ENTITY_ID,
} from "./config.js";

function kratosLogin(email, password) {
  const flowRes = http.get(
    `${KRATOS_PUBLIC_URL}/self-service/login/api`,
    { redirects: 0 }
  );
  if (flowRes.status !== 200) {
    console.error(`[auth] login flow FAILED: ${flowRes.body}`);
    return null;
  }

  const loginRes = http.post(
    `${KRATOS_PUBLIC_URL}/self-service/login?flow=${flowRes.json().id}`,
    JSON.stringify({
      method: "password",
      identifier: email,
      password: password,
    }),
    { headers: { "Content-Type": "application/json" }, redirects: 0 }
  );
  if (loginRes.status !== 200) {
    console.error(`[auth] login FAILED: ${loginRes.body}`);
    return null;
  }

  return loginRes.json().session_token;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    "X-Session-Token": token,
  };
}

export function setupAdminSession() {
  if (SESSION_TOKEN) {
    console.log("[auth] using pre-configured SESSION_TOKEN");
    return { headers: authHeaders(SESSION_TOKEN) };
  }

  const token = kratosLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!token) {
    console.error("[auth] setupAdminSession FAILED: no token");
  }
  return { headers: authHeaders(token) };
}

export function setupOAuth2Token(adminAuth, entityName) {
  if (OAUTH2_TOKEN && ENTITY_ID) {
    console.log("[auth] using pre-configured OAUTH2_TOKEN + ENTITY_ID");
    return {
      entityId: ENTITY_ID,
      accessToken: OAUTH2_TOKEN,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OAUTH2_TOKEN}`,
      },
    };
  }

  const entityRes = http.post(
    `${BASE_URL}/v1/entities`,
    JSON.stringify({
      name: entityName || "Benchmark Entity",
      type: "certifier",
      contactEmail: "benchmark@classicschain.com",
    }),
    { headers: adminAuth.headers }
  );
  if (entityRes.status !== 201) {
    console.error(`[auth] entity creation FAILED: status=${entityRes.status} body=${entityRes.body}`);
  }
  check(entityRes, { "entity created": (r) => r.status === 201 });
  const entity = entityRes.json();

  const clientRes = http.post(
    `${BASE_URL}/v1/entities/${entity.id}/oauth2/clients`,
    JSON.stringify({
      description: "Benchmark OAuth2 client",
      scopes: [
        "vehicles:read",
        "vehicles:write",
        "events:read",
        "events:write",
      ],
    }),
    { headers: adminAuth.headers }
  );
  if (clientRes.status !== 201) {
    console.error(`[auth] oauth2 client FAILED: status=${clientRes.status} body=${clientRes.body}`);
  }
  check(clientRes, { "oauth2 client created": (r) => r.status === 201 });
  const client = clientRes.json();

  const tokenRes = http.post(
    `${HYDRA_PUBLIC_URL}/oauth2/token`,
    "grant_type=client_credentials&scope=vehicles:read vehicles:write events:read events:write",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encoding.b64encode(client.clientId + ":" + client.clientSecret)}`,
      },
    }
  );
  if (tokenRes.status !== 200) {
    console.error(`[auth] token FAILED: ${tokenRes.body}`);
  }
  check(tokenRes, { "token obtained": (r) => r.status === 200 });
  const tokenData = tokenRes.json();

  return {
    entityId: entity.id,
    clientId: client.clientId,
    accessToken: tokenData.access_token,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  };
}
