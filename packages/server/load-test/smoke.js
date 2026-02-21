import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsSuccessRate = new Rate('ws_success_rate');
const wsErrors = new Counter('ws_errors');
const wsMessagesReceived = new Counter('ws_messages_received');

// ─── Lightweight smoke test: 10 concurrent connections ───────────────────────
const SERVER_HOST = __ENV.SERVER_HOST || 'localhost:3000';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    ws_connect_duration: ['p(95)<500'],
    ws_success_rate: ['rate>0.99'],
    ws_errors: ['count<5'],
  },
};

export default function () {
  const vuId = __VU;
  // For smoke test, use a simple token approach
  // Replace with actual auth if needed
  const token = __ENV.TEST_TOKEN || 'smoke-test-token';
  const wsUrl = `ws://${SERVER_HOST}/ws?token=${token}`;

  const connectStart = Date.now();

  const res = ws.connect(wsUrl, {}, function (socket) {
    wsConnectDuration.add(Date.now() - connectStart);
    wsSuccessRate.add(1);

    socket.on('message', function () {
      wsMessagesReceived.add(1);
    });

    socket.on('error', function () {
      wsErrors.add(1);
    });

    // Send heartbeat
    socket.setInterval(function () {
      socket.send(JSON.stringify({
        _tag: 'heartbeat',
        timestamp: Date.now(),
      }));
    }, 5000);

    // Send a few movements
    socket.setInterval(function () {
      socket.send(JSON.stringify({
        _tag: 'movement',
        x: Math.random() * 100,
        y: 0,
        z: Math.random() * 100,
        rotation: Math.random() * Math.PI * 2,
        timestamp: Date.now(),
      }));
    }, 200);

    // Stay connected for 25 seconds
    socket.setTimeout(function () {
      socket.close();
    }, 25000);
  });

  check(res, {
    'WebSocket connected': (r) => r && r.status === 101,
  });
}
