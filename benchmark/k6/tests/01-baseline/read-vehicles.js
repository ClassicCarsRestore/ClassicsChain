import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../../lib/config.js";
import { setupAdminSession, setupOAuth2Token } from "../../lib/auth.js";
import { seedTestData } from "../../lib/helpers.js";

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-arrival-rate",
      rate: 10,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const adminAuth = setupAdminSession();
  const oauth2 = setupOAuth2Token(adminAuth, "Seed Entity");
  const vehicles = seedTestData(oauth2, 50, 0);
  return { adminAuth, vehicleIds: vehicles.map((v) => v.id) };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/v1/vehicles?limit=20&page=1`, {
    headers: data.adminAuth.headers,
  });
  check(res, {
    "status 200": (r) => r.status === 200,
    "has data": (r) => r.json().data.length > 0,
  });
}
