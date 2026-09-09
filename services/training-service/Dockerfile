FROM golang:1.26.3-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o training-service ./cmd/api

FROM alpine:3.21

RUN apk --no-cache add ca-certificates \
    && adduser -D -H -u 10001 appuser \
    && mkdir -p /app/certificates \
    && chown -R appuser:appuser /app

WORKDIR /app

COPY --from=builder /app/training-service .

USER appuser

EXPOSE 8084

CMD ["./training-service"]
