# 04 — Production Deployment

**Last Updated:** 2026-03-05  
**Status:** Reference  
**Section:** arc42 Chapter 7 — Deployment View

---

## Production Checklist

Before any production deployment, verify the following:

- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is a cryptographically random string (≥48 chars), stored in a secrets manager
- [ ] `PAYMENT_WEBHOOK_SECRET` is set and matches the value configured at the payment provider
- [ ] `CORS_ORIGIN` is set to the exact production frontend domain (no trailing slash, no wildcard)
- [ ] MongoDB 27017 port is **not** exposed to the public internet
- [ ] SSL/TLS is terminated at the load balancer or NGINX
- [ ] A backup strategy for `mongo_data` volume is configured
- [ ] Log aggregation is configured (`LOG_LEVEL=warn` or `error` in production)
- [ ] Health check endpoint (`GET /api/health`) is wired to the container orchestrator

---

## Environment Variables (Production)

All secrets must be injected at runtime via a secrets manager, not stored in `.env` files on disk.

| Variable | Production Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Connection string to production MongoDB instance or Atlas cluster |
| `JWT_SECRET` | Randomly generated via secrets manager, rotated quarterly |
| `CORS_ORIGIN` | `https://your-production-domain.com` |
| `LOG_LEVEL` | `warn` |
| `PAYMENT_WEBHOOK_SECRET` | Provisioned by payment provider, stored in secrets manager |

---

## Recommended Deployment Target: VPS / Cloud VM

### Services required on the host:

- Docker Engine 24+
- Docker Compose V2
- NGINX (host-level reverse proxy for SSL termination)
- Certbot (Let's Encrypt TLS certificates)

### NGINX proxy configuration:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        # WebSocket support (Socket.IO)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Database Backup Strategy

MongoDB data is stored in the `mongo_data` Docker named volume. Back it up daily using a cron job:

```bash
#!/bin/bash
# /etc/cron.daily/mongo-backup

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/mongodb
mkdir -p $BACKUP_DIR

docker exec tbs_mongo mongodump \
  --db transport_booking \
  --out /tmp/mongodump_$TIMESTAMP

docker cp tbs_mongo:/tmp/mongodump_$TIMESTAMP $BACKUP_DIR/
docker exec tbs_mongo rm -rf /tmp/mongodump_$TIMESTAMP

# Retain last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

---

## CI/CD Overview (Recommended)

A GitHub Actions pipeline should:

1. On push to `main` / `release/*`:
   - Run linter and unit tests
   - Build Docker images
   - Push images to container registry (e.g., Docker Hub, GHCR)
2. On successful push:
   - SSH into the production server
   - Pull new images: `docker compose pull`
   - Rolling restart: `docker compose up -d --no-deps backend frontend`
   - Run smoke test: `curl https://api.yourdomain.com/api/health`

See [docs/40-dev-guide/git-workflow.md](../40-dev-guide/git-workflow.md) for branching strategy.

---

## MongoDB Atlas (Alternative to Self-Hosted)

For simpler operations, consider [MongoDB Atlas](https://www.mongodb.com/atlas) as a managed database:

1. Create a free-tier cluster on Atlas.
2. Whitelist the production server's IP.
3. Set `MONGO_URI` to the Atlas connection string (includes credentials in the URI).
4. Remove the `mongo` service from `docker-compose.yml`.
5. The `depends_on: mongo` health check must also be removed or replaced with a startup probe.
