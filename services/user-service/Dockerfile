ARG GO_VERSION=1.26.3

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/user-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/user-migrate ./cmd/migrate

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/user-api /app/user-api
COPY --from=builder /out/user-migrate /app/user-migrate
COPY migrations /app/migrations

USER appuser

EXPOSE 8081

CMD ["/app/user-api"]