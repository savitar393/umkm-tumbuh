ARG GO_VERSION=1.26.3

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/partnerships-api ./cmd/api \
    && CGO_ENABLED=0 GOOS=linux go build -o /out/soap-partnerships-api ./cmd/soap

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 appuser

WORKDIR /app

COPY --from=builder /out/partnerships-api /app/partnerships-api

COPY --from=builder /out/soap-partnerships-api /app/soap-partnerships-api

USER appuser

EXPOSE 8082

CMD ["/app/partnerships-api"]
