import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../../lib/config.js";
import { setupAuth } from "../../lib/auth.js";
import {
  seedTestData,
  generateVehiclePayload,
  generateEventPayload,
} from "../../lib/helpers.js";

export const options = {
  scenarios: {
    mixed: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.05"],
  },
};

export function setup() {
  const auth = setupAuth("Seed Entity");
  const vehicles = seedTestData(auth, 100, 3);
  return {
    auth,
    vehicleIds: vehicles.map((v) => v.id),
  };
}

// 80% reads, 20% writes
export default function (data) {
  const op = Math.random();

  if (op < 0.4) {
    // Read: list vehicles
    const page = Math.floor(Math.random() * 5) + 1;
    const res = http.get(
      `${BASE_URL}/v1/vehicles?limit=20&page=${page}`,
      { headers: data.auth.headers }
    );
    check(res, { "list 200": (r) => r.status === 200 });
  } else if (op < 0.6) {
    // Read: get vehicle
    const vid =
      data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
    const res = http.get(`${BASE_URL}/v1/vehicles/${vid}`, {
      headers: data.auth.headers,
    });
    check(res, { "get 200": (r) => r.status === 200 });
  } else if (op < 0.8) {
    // Read: passport (public)
    const vid =
      data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
    const res = http.get(
      `${BASE_URL}/v1/public/passport/${vid}`
    );
    check(res, { "passport 200": (r) => r.status === 200 });
  } else if (op < 0.9) {
    // Write: create vehicle via certifier endpoint
    const payload = generateVehiclePayload();
    const res = http.post(
      `${BASE_URL}/v1/certifiers/vehicles`,
      JSON.stringify(payload),
      { headers: data.auth.headers }
    );
    check(res, { "create vehicle 201": (r) => r.status === 201 });
  } else {
    // Write: create certified event
    const vid =
      data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
    const payload = generateEventPayload(vid, data.auth.entityId);
    const res = http.post(
      `${BASE_URL}/v1/events`,
      JSON.stringify(payload),
      { headers: data.auth.headers }
    );
    check(res, { "create event 201": (r) => r.status === 201 });
  }
}
