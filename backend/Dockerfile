FROM golang:1.25.1-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG BUILD_VERSION=dev
ARG BUILD_COMMIT=unknown

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
	-ldflags="-s -w \
		-X 'main.Version=${BUILD_VERSION}' \
		-X 'main.Commit=${BUILD_COMMIT}'" \
	-o app ./cmd/http/main.go


FROM alpine:3.22

RUN apk add --no-cache ca-certificates curl tzdata

RUN addgroup -g 1000 appgroup && \
	adduser -D -u 1000 -G appgroup appuser

WORKDIR /home/appuser

COPY --from=builder --chown=appuser:appgroup /build/app /home/appuser/app
COPY --from=builder --chown=appuser:appgroup casbin_model.conf /home/appuser/
COPY --from=builder --chown=appuser:appgroup casbin_policy.csv /home/appuser/

RUN mkdir -p /home/appuser/data && chown -R appuser:appgroup /home/appuser/data

USER appuser

EXPOSE 4000

ENTRYPOINT ["/home/appuser/app"]
