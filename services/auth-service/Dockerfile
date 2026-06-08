ARG GO_VERSION=1.26.3

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/auth-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/auth-seed-admin ./cmd/seed-admin

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/auth-api /app/auth-api
COPY --from=builder /out/auth-seed-admin /app/auth-seed-admin

USER appuser

EXPOSE 8080

CMD ["/app/auth-api"]
