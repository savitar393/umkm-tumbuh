ARG GO_VERSION=1.26.3

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/documents-api ./cmd/api

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/documents-api /app/documents-api

RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads

USER appuser

EXPOSE 8080

VOLUME ["/app/uploads"]

CMD ["/app/documents-api"]
