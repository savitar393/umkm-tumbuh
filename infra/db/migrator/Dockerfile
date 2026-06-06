# syntax=docker/dockerfile:1.7

FROM golang:1.26.3-alpine AS builder

RUN apk add --no-cache git ca-certificates

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go install github.com/pressly/goose/v3/cmd/goose@v3.27.1

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata postgresql-client \
    && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /go/bin/goose /usr/local/bin/goose
COPY migrations /app/migrations

USER appuser

ENTRYPOINT ["goose"]