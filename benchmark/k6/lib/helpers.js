import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

const MAKES = [
  "Mercedes-Benz",
  "BMW",
  "Porsche",
  "Jaguar",
  "Alfa Romeo",
  "Fiat",
  "Volkswagen",
  "Ford",
  "Chevrolet",
  "Aston Martin",
];
const MODELS = [
  "300SL",
  "2002",
  "911",
  "E-Type",
  "Spider",
  "500",
  "Beetle",
  "Mustang",
  "Corvette",
  "DB5",
];
const COLORS = [
  "Red",
  "Blue",
  "Silver",
  "Black",
  "White",
  "Green",
  "Yellow",
  "British Racing Green",
];
const BODY_TYPES = ["coupe", "convertible", "sedan", "roadster", "wagon"];
const FUEL_TYPES = ["gasoline", "diesel"];
const EVENT_TYPES = [
  "restoration",
  "car_show",
  "rally",
  "maintenance",
  "inspection",
  "certification",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChassisNo() {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  let vin = "";
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

function randomPlate() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  return (
    letters[randomInt(0, 25)] +
    letters[randomInt(0, 25)] +
    "-" +
    digits[randomInt(0, 9)] +
    digits[randomInt(0, 9)] +
    "-" +
    letters[randomInt(0, 25)] +
    letters[randomInt(0, 25)]
  );
}

export function generateVehiclePayload() {
  return {
    chassisNumber: randomChassisNo(),
    licensePlate: randomPlate(),
    make: randomItem(MAKES),
    model: randomItem(MODELS),
    year: randomInt(1920, 1990),
    color: randomItem(COLORS),
    bodyType: randomItem(BODY_TYPES),
    fuel: randomItem(FUEL_TYPES),
    engineCc: randomInt(800, 6000),
    engineCylinders: randomItem([4, 6, 8, 12]),
    enginePowerHp: randomInt(30, 400),
  };
}

export function generateEventPayload(vehicleId, entityId) {
  const payload = {
    vehicleId: vehicleId,
    type: randomItem(EVENT_TYPES),
    title: `Benchmark ${randomItem(EVENT_TYPES)} event ${Date.now()}`,
    description: "Performance benchmark test event",
    location: "Benchmark Lab",
    date: new Date().toISOString(),
  };
  if (entityId) {
    payload.entityId = entityId;
  }
  return payload;
}

// Create a certified vehicle via entity API
export function createCertifierVehicle(auth) {
  const payload = generateVehiclePayload();
  const res = http.post(
    `${BASE_URL}/v1/certifiers/vehicles`,
    JSON.stringify(payload),
    { headers: auth.headers }
  );
  if (res.status !== 201) {
    console.error(`[helpers] createCertifierVehicle FAILED: status=${res.status} body=${res.body}`);
  }
  check(res, { "certifier vehicle created": (r) => r.status === 201 });
  return res.status === 201 ? res.json() : {};
}

// Create an event for a vehicle
// If entityId is provided, uses the certified event endpoint (POST /events).
// Otherwise uses the owner event endpoint (POST /vehicles/{id}/events).
export function createEvent(auth, vehicleId, entityId) {
  const payload = generateEventPayload(vehicleId, entityId);
  let url;

  if (entityId) {
    url = `${BASE_URL}/v1/events`;
  } else {
    url = `${BASE_URL}/v1/vehicles/${vehicleId}/events`;
  }

  const res = http.post(url, JSON.stringify(payload), {
    headers: auth.headers,
  });
  if (res.status !== 201) {
    console.error(`[helpers] createEvent FAILED: url=${url} status=${res.status} body=${res.body}`);
  }
  check(res, { "event created": (r) => r.status === 201 });
  return res.status === 201 ? res.json() : {};
}

// Seed test data: create N vehicles with M events each.
// entityAuth (OAuth2 with entityId) is required for creating vehicles via certifier endpoint.
export function seedTestData(entityAuth, numVehicles, eventsPerVehicle) {
  const vehicles = [];
  for (let i = 0; i < numVehicles; i++) {
    const v = createCertifierVehicle(entityAuth);
    const events = [];
    for (let j = 0; j < eventsPerVehicle; j++) {
      const e = createEvent(entityAuth, v.id, entityAuth.entityId);
      events.push(e);
    }
    vehicles.push({ ...v, events });
  }
  return vehicles;
}
