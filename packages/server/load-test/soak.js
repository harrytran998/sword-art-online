import ws from 'k6/ws';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const wsMessagesReceived = new Counter('ws_messages_received');
const wsMessagesSent = new Counter('ws_messages_sent');
const broadcastLatency = new Trend('broadcast_latency', true);
const tickBroadcastCount = new Counter('tick_broadcasts_received');

// ─── Sustained load: 100 players for 5 minutes ──────────────────────────────
const SERVER_HOST = __ENV.SERVER_HOST || 'localhost:3000';

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
    },
  },
  thresholds: {
    broadcast_latency: ['p(95)<50', 'p(99)<100'],
    ws_messages_received: ['count>50000'], // Should receive lots of broadcasts
  },
};

export default function () {
  const vuId = __VU;
  const token = __ENV.TEST_TOKEN || `soak-player-${vuId}`;
  const wsUrl = `ws://${SERVER_HOST}/ws?token=${token}`;

  const res = ws.connect(wsUrl, {}, function (socket) {
    socket.on('message', function (rawMsg) {
      wsMessagesReceived.add(1);
      try {
        const msg = JSON.parse(rawMsg);
        if (msg._tag === 'state_update' || msg._tag === 'player_moved') {
          tickBroadcastCount.add(1);
          if (msg.serverTime) {
            broadcastLatency.add(Date.now() - msg.serverTime);
          }
        }
      } catch { /* ignore parse errors */ }
    });

    socket.on('error', function () { /* ignore */ });

    // Heartbeat to stay alive
    socket.setInterval(function () {
      socket.send(JSON.stringify({
        _tag: 'heartbeat',
        timestamp: Date.now(),
      }));
      wsMessagesSent.add(1);
    }, 5000);

    // Constant movement
    let x = Math.random() * 200;
    let z = Math.random() * 200;

    socket.setInterval(function () {
      x += (Math.random() - 0.5) * 4;
      z += (Math.random() - 0.5) * 4;
      x = Math.max(0, Math.min(200, x));
      z = Math.max(0, Math.min(200, z));

      socket.send(JSON.stringify({
        _tag: 'movement',
        x, y: 0, z,
        rotation: Math.atan2(z, x),
        timestamp: Date.now(),
      }));
      wsMessagesSent.add(1);
    }, 100);

    // Run for full duration
    socket.setTimeout(function () {
      socket.close();
    }, 300000);
  });

  check(res, {
    'WebSocket connected': (r) => r && r.status === 101,
  });
}
