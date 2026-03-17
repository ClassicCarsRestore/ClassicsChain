import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../../lib/config.js";
import { setupAdminSession, setupOAuth2Token } from "../../lib/auth.js";
import { seedTestData } from "../../lib/helpers.js";

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "15s", target: 250 }, // Spike up
        { duration: "15s", target: 500 }, // Spike up
        { duration: "15s", target: 500 }, // Hold at peak
        { duration: "15s", target: 1 }, // Crash down
        { duration: "15s", target: 1 }, // Recovery observation
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"], // Allow up to 10% errors during spike
  },
};

export function setup() {
  const adminAuth = setupAdminSession();
  const oauth2 = setupOAuth2Token(adminAuth, "Seed Entity");
  const vehicles = seedTestData(oauth2, 100, 2);
  return {
    adminAuth,
    vehicleIds: vehicles.map((v) => v.id),
  };
}

export default function (data) {
  const op = Math.random();

  if (op < 0.5) {
    // List vehicles
    const res = http.get(`${BASE_URL}/v1/vehicles?limit=20`, {
      headers: data.adminAuth.headers,
    });
    check(res, { "200": (r) => r.status === 200 });
  } else if (op < 0.8) {
    // Get vehicle
    const vid =
      data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
    const res = http.get(`${BASE_URL}/v1/vehicles/${vid}`, {
      headers: data.adminAuth.headers,
    });
    check(res, { "200": (r) => r.status === 200 });
  } else {
    // Public passport
    const vid =
      data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
    const res = http.get(
      `${BASE_URL}/v1/public/passport/${vid}`
    );
    check(res, { "200": (r) => r.status === 200 });
  }
}
