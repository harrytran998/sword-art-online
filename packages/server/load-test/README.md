# Load Testing — Sword Art Online Server

## Prerequisites

```bash
# Install k6 (macOS)
brew install k6
```

## Test Scenarios

| Script | VUs | Duration | Purpose |
|---|---|---|---|
| `smoke.js` | 10 | 30s | Quick sanity check — server handles basic connections |
| `floor1-stress.js` | 0→100 | ~4min | Ramp to 100 players with full gameplay simulation |
| `soak.js` | 100 | 5min | Sustained 100 player load — stability check |

## Running Tests

### 1. Start the server

```bash
cd packages/server && bun run dev
```

### 2. Run smoke test (quick check)

```bash
k6 run packages/server/load-test/smoke.js
```

### 3. Run the main 100-player stress test

```bash
k6 run packages/server/load-test/floor1-stress.js
```

With a custom server host:

```bash
k6 run --env SERVER_HOST=staging.example.com:3000 packages/server/load-test/floor1-stress.js
```

### 4. Run the soak test (sustained load)

```bash
k6 run packages/server/load-test/soak.js
```

## Pass/Fail Thresholds

| Metric | Target |
|---|---|
| WebSocket connect time (p95) | < 1s |
| Success rate | > 95% |
| Movement round-trip latency (p95) | < 100ms |
| Broadcast latency (p95) | < 50ms |
| Total errors | < 50 |

## Authentication for Load Tests

The `floor1-stress.js` script attempts to authenticate via Better Auth's `/api/auth/sign-up/email` and `/api/auth/sign-in/email` endpoints. For smoke/soak tests, you can pass a pre-generated token:

```bash
k6 run --env TEST_TOKEN=your-jwt-token packages/server/load-test/smoke.js
```

### Test Mode (recommended for CI)

For CI/CD, consider adding a test auth bypass that accepts tokens with a `loadtest_` prefix when `NODE_ENV=test`:

```typescript
// In server.ts verifyToken():
if (config.nodeEnv === 'test' && token.startsWith('loadtest_')) {
  return { sub: token }; // bypass JWT verification
}
```

## Output

Results are printed to stdout and saved to `load-test-results.json` (for the stress test). Example output:

```json
{
  "total_vus_peak": 100,
  "ws_connect_p95": 234,
  "ws_success_rate": 0.98,
  "movement_p95": 42,
  "total_messages_sent": 125000,
  "total_messages_received": 450000,
  "total_errors": 3
}
```
