FROM alpine:3.21

RUN apk add --no-cache curl jq \
    && adduser -D -H -u 10001 appuser \
    && mkdir -p /run/garage \
    && chown appuser:appuser /run/garage \
    && chmod 700 /run/garage

COPY bootstrap.sh /app/bootstrap.sh
USER appuser
ENTRYPOINT ["sh", "/app/bootstrap.sh"]
