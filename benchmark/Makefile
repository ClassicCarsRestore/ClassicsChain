.PHONY: setup run-baseline run-scaling run-all report clean

K6 ?= k6
RESULTS_DIR = results
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)
K6_OUT = --out json=$(RESULTS_DIR)/$(TEST_NAME)_$(TIMESTAMP).json --summary-export=$(RESULTS_DIR)/$(TEST_NAME)_$(TIMESTAMP)_summary.json

# Environment defaults (override via env vars or .env)
export BASE_URL ?= http://localhost:4000
export KRATOS_PUBLIC_URL ?= http://localhost:4433
export KRATOS_ADMIN_URL ?= http://localhost:4434
export HYDRA_PUBLIC_URL ?= http://localhost:4444
export HYDRA_ADMIN_URL ?= http://localhost:4445
export ADMIN_EMAIL ?= $(error ADMIN_EMAIL not set — source backend/.envrc or export it)
export ADMIN_PASSWORD ?= $(error ADMIN_PASSWORD not set — source backend/.envrc or export it)

setup:
	@echo "Checking k6 installation..."
	@which $(K6) > /dev/null 2>&1 || (echo "k6 not found. Install: https://grafana.com/docs/k6/latest/set-up/install-k6/" && exit 1)
	@mkdir -p $(RESULTS_DIR)
	@echo "Setup complete."

# ── Baseline (01) ──────────────────────────────────────────────
run-baseline-read-vehicles:
	$(eval TEST_NAME := baseline_read_vehicles)
	$(K6) run $(K6_OUT) k6/tests/01-baseline/read-vehicles.js

run-baseline-write-vehicle:
	$(eval TEST_NAME := baseline_write_vehicle)
	$(K6) run $(K6_OUT) k6/tests/01-baseline/write-vehicle.js

run-baseline-write-event-anchored:
	$(eval TEST_NAME := baseline_write_event_anchored)
	$(K6) run $(K6_OUT) k6/tests/01-baseline/write-event-anchored.js

run-baseline: run-baseline-read-vehicles run-baseline-write-vehicle \
              run-baseline-write-event-anchored

# ── Scaling (03) ───────────────────────────────────────────────
run-scaling-mixed:
	$(eval TEST_NAME := scaling_mixed)
	$(K6) run $(K6_OUT) k6/tests/03-scaling/ramp-mixed.js

run-scaling-spike:
	$(eval TEST_NAME := scaling_spike)
	$(K6) run $(K6_OUT) k6/tests/03-scaling/spike.js

run-scaling: run-scaling-mixed run-scaling-spike

# ── All ────────────────────────────────────────────────────────
run-all: run-baseline run-scaling

# ── Analysis ───────────────────────────────────────────────────
REPORT_IMAGE = cc-benchmark-report

report-build:
	docker build -t $(REPORT_IMAGE) -f analysis/Dockerfile .

report: report-build
	docker run --rm \
		-v $(CURDIR)/results:/work/results \
		-v $(CURDIR)/analysis:/work/analysis \
		$(REPORT_IMAGE) \
		--results-dir results \
		--output-dir results/report_$(TIMESTAMP)

clean:
	rm -rf $(RESULTS_DIR)/*.json $(RESULTS_DIR)/report_*
