import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsMessagesReceived = new Counter('ws_messages_received');
const wsMessagesSent = new Counter('ws_messages_sent');
const wsErrors = new Counter('ws_errors');
const wsSuccessRate = new Rate('ws_success_rate');
const movementLatency = new Trend('movement_latency', true);

// ─── Test configuration ──────────────────────────────────────────────────────
const SERVER_HOST = __ENV.SERVER_HOST || 'localhost:3000';
const AUTH_HOST = __ENV.AUTH_HOST || `http://${SERVER_HOST}`;

export const options = {
  scenarios: {
    // Ramp up to 100 concurrent players
    floor1_players: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },   // warm up
        { duration: '30s', target: 50 },   // half load
        { duration: '30s', target: 100 },  // full load
        { duration: '120s', target: 100 }, // sustain 100 players
        { duration: '30s', target: 0 },    // ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // WebSocket connection time: 95% under 1s
    ws_connect_duration: ['p(95)<1000'],
    // Success rate: at least 95%
    ws_success_rate: ['rate>0.95'],
    // Movement P95 latency under 100ms
    movement_latency: ['p(95)<100'],
    // No excessive errors
    ws_errors: ['count<50'],
  },
};

// ─── Helper: Get a test JWT token ────────────────────────────────────────────
// In a real test, you'd register/login test users via the /api/auth endpoints.
// For load testing, you can use a test-mode endpoint or pre-generated tokens.
function getTestToken(vuId) {
  // Option 1: Use Better Auth's sign-up/sign-in endpoint
  // Option 2: Use pre-generated tokens from a setup script
  // Option 3: Bypass auth in test mode with a known test token
  //
  // For now, we'll try to register/login a test user via the auth API.
  // If your server has a test mode, replace this with a static token.

  const email = `loadtest_player_${vuId}@test.sao`;
  const password = 'LoadTest123!';
  const name = `LoadTestPlayer${vuId}`;

  // Try sign up first
  const signUpRes = http.post(`${AUTH_HOST}/api/auth/sign-up/email`, JSON.stringify({
    email,
    password,
    name,
  }), { headers: { 'Content-Type': 'application/json' } });

  // Then sign in to get session token
  const signInRes = http.post(`${AUTH_HOST}/api/auth/sign-in/email`, JSON.stringify({
    email,
    password,
  }), { headers: { 'Content-Type': 'application/json' } });

  if (signInRes.status !== 200) {
    console.error(`Auth failed for VU ${vuId}: ${signInRes.status}`);
    return null;
  }

  const cookies = signInRes.cookies;
  const sessionToken = cookies?.['better-auth.session_token']?.value;

  if (!sessionToken) {
    // Try to get token from response body
    try {
      const body = JSON.parse(signInRes.body);
      return body.token || body.session?.token || null;
    } catch {
      return null;
    }
  }

  return sessionToken;
}

import http from 'k6/http';

// ─── Main test function ──────────────────────────────────────────────────────
export default function () {
  const vuId = __VU;
  const token = getTestToken(vuId);

  if (!token) {
    wsErrors.add(1);
    wsSuccessRate.add(0);
    console.error(`VU ${vuId}: Could not obtain auth token, skipping`);
    sleep(5);
    return;
  }

  const wsUrl = `ws://${SERVER_HOST}/ws?token=${token}`;
  const connectStart = Date.now();

  const res = ws.connect(wsUrl, {}, function (socket) {
    const connectEnd = Date.now();
    wsConnectDuration.add(connectEnd - connectStart);
    wsSuccessRate.add(1);

    let characterId = null;
    let serverTimeOffset = 0;

    // ─── Handle incoming messages ──────────────────────────────────────
    socket.on('message', function (rawMsg) {
      wsMessagesReceived.add(1);
      try {
        const msg = JSON.parse(rawMsg);

        switch (msg._tag) {
          case 'connection_ready':
            console.log(`VU ${vuId}: Connected as ${msg.playerId}`);
            break;

          case 'character_data':
            characterId = msg.characterId;
            console.log(`VU ${vuId}: Character loaded — ${msg.name} (Lv.${msg.level})`);
            break;

          case 'no_character':
            // Create a test character
            socket.send(JSON.stringify({
              _tag: 'create_character',
              name: `Stress${vuId}_${Date.now().toString(36)}`,
              classId: (vuId % 7) + 1, // Distribute across 7 classes
            }));
            wsMessagesSent.add(1);
            break;

          case 'heartbeat_ack':
            serverTimeOffset = msg.serverTime - msg.clientTime;
            movementLatency.add(Date.now() - msg.clientTime);
            break;

          case 'player_joined':
          case 'player_left':
          case 'player_moved':
          case 'state_update':
            // Normal zone broadcasts — just count them
            break;

          case 'error':
            wsErrors.add(1);
            console.warn(`VU ${vuId}: Server error — ${msg.code}: ${msg.message}`);
            break;
        }
      } catch (e) {
        wsErrors.add(1);
      }
    });

    socket.on('error', function (e) {
      wsErrors.add(1);
      console.error(`VU ${vuId}: WebSocket error — ${e.error()}`);
    });

    // ─── Simulate heartbeat (every 5s) ─────────────────────────────────
    socket.setInterval(function () {
      socket.send(JSON.stringify({
        _tag: 'heartbeat',
        timestamp: Date.now(),
      }));
      wsMessagesSent.add(1);
    }, 5000);

    // ─── Simulate movement (every 100ms = 10 ticks/sec) ────────────────
    let posX = 50 + Math.random() * 100;
    let posZ = 50 + Math.random() * 100;
    const moveAngle = Math.random() * Math.PI * 2;
    const moveSpeed = 2; // units per tick

    socket.setInterval(function () {
      // Simulate a player walking in a circle with some randomness
      const angle = moveAngle + (Date.now() / 3000) + Math.sin(Date.now() / 1000) * 0.5;
      posX += Math.cos(angle) * moveSpeed;
      posZ += Math.sin(angle) * moveSpeed;

      // Keep within bounds
      posX = Math.max(0, Math.min(200, posX));
      posZ = Math.max(0, Math.min(200, posZ));

      socket.send(JSON.stringify({
        _tag: 'movement',
        x: posX,
        y: 0,
        z: posZ,
        rotation: angle,
        timestamp: Date.now(),
      }));
      wsMessagesSent.add(1);
    }, 100);

    // ─── Simulate skill activation (every 3-8s) ───────────────────────
    socket.setInterval(function () {
      const skillId = Math.floor(Math.random() * 5) + 1;
      socket.send(JSON.stringify({
        _tag: 'skill_activate',
        skillId,
        targetId: null,
      }));
      wsMessagesSent.add(1);
    }, 3000 + Math.random() * 5000);

    // ─── Stay connected for the test duration ──────────────────────────
    // k6 automatically manages the connection lifecycle based on VU stages.
    // We use setTimeout as a safety net.
    socket.setTimeout(function () {
      socket.close();
    }, 240000); // 4 minutes max
  });

  check(res, {
    'WebSocket connection established': (r) => r && r.status === 101,
  });
}

// ─── Summary handler ─────────────────────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    total_vus_peak: data.metrics.vus_max?.values?.max || 0,
    ws_connect_p95: data.metrics.ws_connect_duration?.values?.['p(95)'] || 0,
    ws_success_rate: data.metrics.ws_success_rate?.values?.rate || 0,
    movement_p95: data.metrics.movement_latency?.values?.['p(95)'] || 0,
    total_messages_sent: data.metrics.ws_messages_sent?.values?.count || 0,
    total_messages_received: data.metrics.ws_messages_received?.values?.count || 0,
    total_errors: data.metrics.ws_errors?.values?.count || 0,
  };

  return {
    stdout: JSON.stringify(summary, null, 2) + '\n',
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
