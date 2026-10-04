FROM golang:1.26.3-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o gateway main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/gateway .
CMD ["./gateway"]
