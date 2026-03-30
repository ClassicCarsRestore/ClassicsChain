import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, VERIFY_ANCHORING } from "../../lib/config.js";
import { setupAuth } from "../../lib/auth.js";
import {
  createCertifierVehicle,
  generateEventPayload,
} from "../../lib/helpers.js";

const anchorLatency = new Trend("anchor_latency", true);

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-arrival-rate",
      rate: 10,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const auth = setupAuth("Benchmark Workshop");

  const vehicles = [];
  for (let i = 0; i < 5; i++) {
    vehicles.push(createCertifierVehicle(auth));
  }

  // Create a small batch of tracked events for post-test anchoring verification
  const trackedEvents = [];
  for (let i = 0; i < 5; i++) {
    const vid = vehicles[i % vehicles.length].id;
    const payload = generateEventPayload(vid, auth.entityId);
    const res = http.post(`${BASE_URL}/v1/events`, JSON.stringify(payload), {
      headers: auth.headers,
    });
    if (res.status === 201) {
      const evt = res.json();
      trackedEvents.push({
        id: evt.id,
        createdAt: Date.now(),
      });
    }
  }

  return {
    auth,
    vehicleIds: vehicles.map((v) => v.id),
    trackedEvents,
  };
}

export default function (data) {
  const vid =
    data.vehicleIds[Math.floor(Math.random() * data.vehicleIds.length)];
  const payload = generateEventPayload(vid, data.auth.entityId);
  const res = http.post(`${BASE_URL}/v1/events`, JSON.stringify(payload), {
    headers: data.auth.headers,
  });
  check(res, {
    "status 201": (r) => r.status === 201,
    "status is pending": (r) => {
      const body = r.json();
      return body.blockchainStatus === "pending";
    },
  });
}

export function teardown(data) {
  if (!VERIFY_ANCHORING) {
    return;
  }
  if (!data.trackedEvents || data.trackedEvents.length === 0) {
    console.warn("No tracked events to verify anchoring");
    return;
  }

  const maxWait = 60; // seconds
  const pollInterval = 2; // seconds
  let allAnchored = false;

  for (let elapsed = 0; elapsed < maxWait; elapsed += pollInterval) {
    sleep(pollInterval);

    allAnchored = true;
    for (const evt of data.trackedEvents) {
      const res = http.get(`${BASE_URL}/v1/events/${evt.id}`, {
        headers: data.auth.headers,
      });
      if (res.status === 200) {
        const body = res.json();
        if (body.blockchainStatus !== "anchored") {
          allAnchored = false;
        }
      }
    }

    if (allAnchored) {
      const now = Date.now();
      for (const evt of data.trackedEvents) {
        anchorLatency.add(now - evt.createdAt);
      }
      console.log(
        `All ${data.trackedEvents.length} tracked events anchored after ~${elapsed + pollInterval}s`
      );
      return;
    }
  }

  // Final check — report what didn't anchor
  let anchored = 0;
  let failed = 0;
  let pending = 0;
  for (const evt of data.trackedEvents) {
    const res = http.get(`${BASE_URL}/v1/events/${evt.id}`, {
      headers: data.auth.headers,
    });
    if (res.status === 200) {
      const status = res.json().blockchainStatus;
      if (status === "anchored") anchored++;
      else if (status === "failed") failed++;
      else pending++;
    }
  }
  console.warn(
    `Anchoring verification timed out after ${maxWait}s: ` +
      `${anchored} anchored, ${pending} pending, ${failed} failed ` +
      `(of ${data.trackedEvents.length} tracked)`
  );
}
