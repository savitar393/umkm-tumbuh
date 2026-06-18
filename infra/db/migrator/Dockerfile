FROM postgres:16-alpine

RUN adduser -D -H -u 10001 appuser

WORKDIR /app

COPY migrations /app/migrations
COPY migrator/run-migrations.sh /app/run-migrations.sh

RUN chmod +x /app/run-migrations.sh \
    && chown -R appuser:appuser /app

USER appuser

ENTRYPOINT ["/app/run-migrations.sh"]
