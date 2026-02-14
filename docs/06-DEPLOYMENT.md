# Sword Art Online
## Deployment Infrastructure Document

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Cloud Provider & Services](#2-cloud-provider--services)
3. [Kubernetes Architecture](#3-kubernetes-architecture)
4. [Container Configuration](#4-container-configuration)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Monitoring & Alerting](#6-monitoring--alerting)
7. [Scaling Strategy](#7-scaling-strategy)
8. [Disaster Recovery](#8-disaster-recovery)

---

## 1. Infrastructure Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION INFRASTRUCTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     ┌────────────────────────────────────────────────────────────┐      │
│     │                    CLOUDFLARE (Edge)                        │      │
│     │  • DDoS Protection                                          │      │
│     │  • WAF (Web Application Firewall)                          │      │
│     │  • CDN for static assets                                   │      │
│     │  • SSL/TLS termination                                     │      │
│     └────────────────────────────┬───────────────────────────────┘      │
│                                  │                                       │
│     ┌────────────────────────────▼───────────────────────────────┐      │
│     │                    LOAD BALANCER                            │      │
│     │  • NGINX Ingress Controller                                │      │
│     │  • SSL termination (internal)                              │      │
│     │  • WebSocket support                                       │      │
│     └────────────────────────────┬───────────────────────────────┘      │
│                                  │                                       │
│     ┌────────────────────────────▼───────────────────────────────┐      │
│     │                    KUBERNETES CLUSTER                        │      │
│     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │      │
│     │  │ Game     │  │ Game     │  │ Game     │  │ API      │    │      │
│     │  │ Server 1 │  │ Server 2 │  │ Server N │  │ Server   │    │      │
│     │  │(Zone 1-20)│ │(Zone 21-40)│ │(Zone 81-100)│ │(REST)   │    │      │
│     │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │      │
│     └────────────────────────────┬───────────────────────────────┘      │
│                                  │                                       │
│     ┌────────────────────────────┴───────────────────────────────┐      │
│     │                    DATA LAYER                               │      │
│     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │      │
│     │  │PostgreSQL│  │  Redis   │  │TimescaleDB│ │   S3     │    │      │
│     │  │ Primary  │  │ Cluster  │  │ Analytics │ │ Storage  │    │      │
│     │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │      │
│     └────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Environment Strategy

| Environment | Purpose | Scale | Data |
|-------------|---------|-------|------|
| **Development** | Local development | Single instance | Mock data |
| **Staging** | Integration testing | 2 replicas | Anonymized prod copy |
| **Production** | Live game | Auto-scaled | Real data |

---

## 2. Cloud Provider & Services

### 2.1 Recommended Provider: AWS

| Service | AWS Product | Purpose |
|---------|-------------|---------|
| **Compute** | EKS (Elastic Kubernetes Service) | Container orchestration |
| **Database** | RDS PostgreSQL | Primary data store |
| **Cache** | ElastiCache (Redis) | Session cache, leaderboards |
| **Analytics** | TimescaleDB on EC2 | Time-series data |
| **Storage** | S3 | Static assets, backups |
| **CDN** | CloudFront | Asset delivery |
| **DNS** | Route 53 | DNS management |
| **Secrets** | Secrets Manager | Credential management |
| **Monitoring** | CloudWatch + Prometheus | Metrics and logs |

### 2.2 Alternative: Google Cloud Platform

| Service | GCP Product | Purpose |
|---------|-------------|---------|
| **Compute** | GKE (Google Kubernetes Engine) | Container orchestration |
| **Database** | Cloud SQL (PostgreSQL) | Primary data store |
| **Cache** | Memorystore (Redis) | Session cache |
| **Analytics** | BigQuery | Analytics |
| **Storage** | Cloud Storage | Static assets |
| **CDN** | Cloud CDN | Asset delivery |

### 2.3 Cost Estimation

| Resource | Monthly Cost (Estimated) |
|----------|-------------------------|
| EKS Cluster (3 nodes) | $600 |
| RDS PostgreSQL (db.r6g.xlarge) | $400 |
| ElastiCache Redis (2 nodes) | $300 |
| Load Balancer | $100 |
| CloudWatch | $100 |
| S3 Storage | $50 |
| **Total** | **~$1,550/month** |

---

## 3. Kubernetes Architecture

### 3.1 Cluster Configuration

```yaml
# cluster-config.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: sao-production
  region: us-east-1
  version: "1.28"

nodeGroups:
  - name: game-servers
    instanceType: c6i.2xlarge  # 8 vCPU, 16 GB RAM
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    labels:
      role: game-server
    taints:
      - key: game-server
        value: "true"
        effect: NoSchedule
        
  - name: api-servers
    instanceType: c6i.xlarge  # 4 vCPU, 8 GB RAM
    desiredCapacity: 2
    minSize: 2
    maxSize: 5
    labels:
      role: api-server
      
  - name: workers
    instanceType: c6i.large  # 2 vCPU, 4 GB RAM
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    labels:
      role: worker

managedNodeGroups:
  - name: system
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 3
    labels:
      role: system
```

### 3.2 Namespace Structure

```yaml
# Namespaces
apiVersion: v1
kind: Namespace
metadata:
  name: sao-production
  labels:
    name: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: sao-monitoring
  labels:
    name: monitoring
```

### 3.3 Game Server Deployment

```yaml
# deployments/game-server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-server
  namespace: sao-production
  labels:
    app: game-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: game-server
  template:
    metadata:
      labels:
        app: game-server
    spec:
      nodeSelector:
        role: game-server
      tolerations:
        - key: game-server
          operator: Equal
          value: "true"
          effect: NoSchedule
      containers:
        - name: game-server
          image: sao/game-server:latest
          ports:
            - containerPort: 8080
              name: websocket
            - containerPort: 9090
              name: metrics
          resources:
            requests:
              cpu: "4000m"
              memory: "8Gi"
            limits:
              cpu: "8000m"
              memory: "14Gi"
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "8080"
            - name: ZONE_RANGE
              valueFrom:
                configMapKeyRef:
                  name: game-config
                  key: zone-range
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: password
            - name: REDIS_HOST
              valueFrom:
                configMapKeyRef:
                  name: redis-config
                  key: host
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: game-server
  namespace: sao-production
spec:
  selector:
    app: game-server
  ports:
    - name: websocket
      port: 8080
      targetPort: 8080
    - name: metrics
      port: 9090
      targetPort: 9090
  type: ClusterIP
```

### 3.4 Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sao-ingress
  namespace: sao-production
  annotations:
    nginx.ingress.kubernetes.io/websocket-services: "game-server"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-body-size: "64m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - game.sword-art-online.com
        - api.sword-art-online.com
      secretName: sao-tls
  rules:
    - host: game.sword-art-online.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: game-server
                port:
                  number: 8080
    - host: api.sword-art-online.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-server
                port:
                  number: 8080
```

---

## 4. Container Configuration

### 4.1 Dockerfile

```dockerfile
# Dockerfile
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build TypeScript
RUN bun build ./src/index.ts --outfile ./dist/index.js --target bun

# Production stage
FROM oven/bun:1-slim AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 gamegroup
RUN adduser --system --uid 1001 gameuser

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/migrations ./migrations

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER gameuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1

# Start server
CMD ["bun", "run", "dist/index.js"]
```

### 4.2 Docker Compose (Development)

```yaml
# docker-compose.yaml
version: '3.8'

services:
  game-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=sao
      - DB_USER=sao
      - DB_PASSWORD=dev_password
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src:ro
      - ./migrations:/app/migrations:ro

  postgres:
    image: postgres:18-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=sao
      - POSTGRES_USER=sao
      - POSTGRES_PASSWORD=dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sao"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  timescaledb:
    image: timescale/timescaledb:latest-pg18
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_DB=sao_analytics
      - POSTGRES_USER=sao
      - POSTGRES_PASSWORD=dev_password
    volumes:
      - timescale_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  redis_data:
  timescale_data:
```

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run linter
        run: bun run lint
      
      - name: Run tests
        run: bun run test
      
      - name: Type check
        run: bun run typecheck

  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=ref,event=branch
            type=semver,pattern={{version}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set kubeconfig
        run: |
          aws eks update-kubeconfig --name sao-staging --region us-east-1
      
      - name: Deploy to staging
        run: |
          kubectl set image deployment/game-server \
            game-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n sao-staging
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/game-server -n sao-staging --timeout=300s

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set kubeconfig
        run: |
          aws eks update-kubeconfig --name sao-production --region us-east-1
      
      - name: Deploy to production (canary)
        run: |
          # Start with 10% of traffic to new version
          kubectl patch deployment game-server \
            -n sao-production \
            --type='json' \
            -p='[{"op": "replace", "path": "/spec/replicas", "value": 1}]'
          
          kubectl set image deployment/game-server \
            game-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n sao-production
      
      - name: Verify canary
        run: |
          # Wait and check metrics
          sleep 60
          # If metrics are good, continue
      
      - name: Full rollout
        run: |
          kubectl patch deployment game-server \
            -n sao-production \
            --type='json' \
            -p='[{"op": "replace", "path": "/spec/replicas", "value": 3}]'
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/game-server -n sao-production --timeout=300s
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to production: ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 5.2 Deployment Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    1. BUILD & TEST                                              │
│    ├── Lint, type check, unit tests                             │
│    └── Build Docker image                                       │
│                                                                  │
│    2. STAGING DEPLOYMENT                                        │
│    ├── Deploy to staging cluster                                │
│    ├── Run integration tests                                    │
│    └── Manual QA (optional)                                     │
│                                                                  │
│    3. PRODUCTION CANARY                                         │
│    ├── Deploy 1 replica (10% traffic)                           │
│    ├── Monitor for 5 minutes                                    │
│    └── Automatic rollback on errors                             │
│                                                                  │
│    4. FULL ROLLOUT                                              │
│    ├── Scale to full replicas                                   │
│    ├── Monitor for 15 minutes                                   │
│    └── Mark deployment complete                                 │
│                                                                  │
│    5. ROLLBACK (if needed)                                      │
│    ├── Automatic on error rate spike                            │
│    ├── Manual rollback available                                │
│    └── Previous version kept for 24 hours                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Monitoring & Alerting

### 6.1 Prometheus Stack

```yaml
# monitoring/prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: gp3
          resources:
            requests:
              storage: 100Gi
    serviceMonitorSelector:
      matchLabels:
        release: prometheus

grafana:
  adminPassword: ${GRAFANA_PASSWORD}
  persistence:
    enabled: true
    size: 10Gi
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: 'default'
          orgId: 1
          folder: ''
          type: file
          disableDeletion: false
          editable: true
          options:
            path: /var/lib/grafana/dashboards/default
```

### 6.2 Service Monitors

```yaml
# monitoring/game-server-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: game-server
  namespace: sao-monitoring
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: game-server
  namespaceSelector:
    matchNames:
      - sao-production
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s
```

### 6.3 Key Metrics

```yaml
# Grafana Dashboard - Key Metrics
# Game Server Metrics
- game_players_online{zone="*"}
- game_tick_duration_millis
- game_messages_total
- game_combat_events_total
- game_websocket_connections
- game_websocket_messages_received
- game_websocket_messages_sent

# Infrastructure Metrics
- container_cpu_usage_seconds_total
- container_memory_working_set_bytes
- node_cpu_seconds_total
- node_memory_MemAvailable_bytes

# Database Metrics
- pg_stat_database_numbackends
- pg_stat_database_tup_fetched
- pg_stat_database_tup_inserted
- redis_connected_clients
- redis_memory_used_bytes

# Security Metrics
- security_events_total{type="*"}
- rate_limit_exceeded_total
- authentication_failures_total
```

### 6.4 Alert Rules

```yaml
# monitoring/alert-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: game-server-alerts
  namespace: sao-monitoring
spec:
  groups:
    - name: game-server
      rules:
        - alert: HighTickDuration
          expr: histogram_quantile(0.95, rate(game_tick_duration_millis_bucket[5m])) > 20
          for: 2m
          labels:
            severity: warning
          annotations:
            summary: "Game tick duration is too high"
            description: "95th percentile tick duration is {{ $value }}ms (threshold: 20ms)"
        
        - alert: HighErrorRate
          expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "High error rate detected"
            description: "Error rate is {{ $value | humanizePercentage }}"
        
        - alert: LowPlayerCount
          expr: game_players_online < 100
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Unusually low player count"
            description: "Only {{ $value }} players online"
        
        - alert: DatabaseConnectionPoolExhausted
          expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.9
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "Database connection pool near exhaustion"
            description: "{{ $value | humanizePercentage }} of connections in use"
        
        - alert: SecurityEventSpike
          expr: rate(security_events_total[5m]) > 10
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Spike in security events"
            description: "{{ $value }} security events per second"
```

---

## 7. Scaling Strategy

### 7.1 Horizontal Pod Autoscaler

```yaml
# hpa/game-server.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-server
  namespace: sao-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: game_players_per_instance
        target:
          type: AverageValue
          averageValue: 500  # Target 500 players per instance
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

### 7.2 Zone-Based Scaling

```yaml
# Zone assignment config
# When a zone reaches 80% capacity, spin up dedicated instance
apiVersion: v1
kind: ConfigMap
metadata:
  name: zone-scaling-config
  namespace: sao-production
data:
  zones.yaml: |
    zones:
      - id: floor_1_town
        maxPlayers: 500
        dedicatedInstances: 0
      - id: floor_50_boss_room
        maxPlayers: 100
        dedicatedInstances: 1  # Boss rooms get dedicated servers
```

### 7.3 Database Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE SCALING ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                  PostgreSQL                          │      │
│    │                                                      │      │
│    │  ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │      │
│    │  │   Primary   │───▶│   Replica 1 │    │ Replica 2│ │      │
│    │  │  (Writes)   │    │  (Reads)    │    │ (Reads)  │ │      │
│    │  └─────────────┘    └─────────────┘    └──────────┘ │      │
│    │                                                      │      │
│    │  Connection Pool: PgBouncer (1000 connections)       │      │
│    │  Read/Write Split: Yes                               │      │
│    │                                                      │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                    Redis                             │      │
│    │                                                      │      │
│    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │      │
│    │  │ Master   │──│ Replica  │──│ Replica  │           │      │
│    │  │(Read/Write)│(Read)     │  │(Read)    │           │      │
│    │  └──────────┘  └──────────┘  └──────────┘           │      │
│    │                                                      │      │
│    │  Cluster Mode: 3 masters, 3 replicas                 │      │
│    │                                                      │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

```yaml
# Backup Schedule
backups:
  postgresql:
    full:
      schedule: "0 2 * * *"  # Daily at 2 AM
      retention: 30 days
    incremental:
      schedule: "0 */6 * * *"  # Every 6 hours
      retention: 7 days
    wal_archive: continuous
  
  redis:
    rdb:
      schedule: "0 */6 * * *"  # Every 6 hours
      retention: 7 days
  
  s3:
    versioning: enabled
    lifecycle:
      - name: archive-old-versions
        prefix: backups/
        days: 30
        storageClass: GLACIER
```

### 8.2 Recovery Procedures

```bash
# PostgreSQL Point-in-Time Recovery
# 1. Stop application
kubectl scale deployment game-server --replicas=0 -n sao-production

# 2. Restore from base backup
aws rds restore-db-instance-from-s3 \
  --db-instance-identifier sao-restored \
  --s3-bucket-name sao-backups \
  --s3-prefix postgresql/backups/$(date +%Y-%m-%d)

# 3. Apply WAL files to target time
# (Automated by RDS)

# 4. Verify data integrity
psql -h sao-restored.xxx.region.rds.amazonaws.com -c "SELECT COUNT(*) FROM players"

# 5. Update application connection string
kubectl set env deployment/game-server \
  DB_HOST=sao-restored.xxx.region.rds.amazonaws.com

# 6. Scale application back up
kubectl scale deployment game-server --replicas=3 -n sao-production
```

### 8.3 Failover Configuration

```yaml
# PodDisruptionBudget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: game-server-pdb
  namespace: sao-production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: game-server
```

### 8.4 Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single pod failure | 30 seconds | 0 |
| Node failure | 2 minutes | 0 |
| Availability zone failure | 5 minutes | 0 |
| Database failure | 15 minutes | 1 minute |
| Region failure | 1 hour | 5 minutes |
| Complete data loss | 4 hours | 1 hour |

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** DevOps Team
