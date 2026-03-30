import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../../lib/config.js";
import { setupAuth } from "../../lib/auth.js";
import { generateVehiclePayload } from "../../lib/helpers.js";

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
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const auth = setupAuth("Write Vehicle Test");
  return { auth };
}

export default function (data) {
  const payload = generateVehiclePayload();
  const res = http.post(
    `${BASE_URL}/v1/certifiers/vehicles`,
    JSON.stringify(payload),
    { headers: data.auth.headers }
  );
  check(res, {
    "status 201": (r) => r.status === 201,
    "has id": (r) => r.json().id !== undefined,
  });
}
