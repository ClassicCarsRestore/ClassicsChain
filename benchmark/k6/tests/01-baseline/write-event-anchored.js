import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../../lib/config.js";
import { setupAdminSession, setupOAuth2Token } from "../../lib/auth.js";
import { createCertifierVehicle, generateEventPayload } from "../../lib/helpers.js";

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-arrival-rate",
      rate: 2, // Lower rate due to blockchain latency (~4.5s per tx)
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<15000"], // Blockchain adds ~4.5s
    http_req_failed: ["rate<0.05"],
  },
};

export function setup() {
  const adminAuth = setupAdminSession();
  const oauth2 = setupOAuth2Token(adminAuth, "Benchmark Workshop");

  const vehicles = [];
  for (let i = 0; i < 5; i++) {
    vehicles.push(createCertifierVehicle(oauth2));
  }
  return {
    oauth2,
    vehicleIds: vehicles.map((v) => v.id),
  };
}

export default function (data) {
  const vid =
    data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
  const payload = generateEventPayload(vid, data.oauth2.entityId);
  const res = http.post(`${BASE_URL}/v1/events`, JSON.stringify(payload), {
    headers: data.oauth2.headers,
  });
  check(res, {
    "status 201": (r) => r.status === 201,
    "has blockchain tx": (r) => {
      const body = r.json();
      return body.blockchainTxId !== null && body.blockchainTxId !== undefined;
    },
  });
}
