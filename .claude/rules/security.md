---
paths:
  - "packages/server/src/**/*.ts"
  - "packages/client/src/**/*.ts"
---

# Security Rules — MANDATORY

## Server-Authoritative Design
- NEVER trust client input. Validate everything server-side.
- Movement: server validates position, speed, collision. Client is display-only.
- Combat: server calculates damage, range, cooldowns. Client sends intent only.
- Economy: server processes all Col transfers. Client cannot modify balances.

## Input Validation
- Validate all WebSocket message schemas at the gateway layer
- Rate limit per connection (configurable per message type)
- Reject messages that exceed maximum payload size

## Authentication
- JWT with short expiration (15 minutes access, 7 days refresh)
- Validate JWT on every WebSocket message (cached validation)
- Session binding: JWT is tied to WebSocket connection ID

## Anti-Cheat
- Speed hack detection: reject movement exceeding max velocity
- Teleport detection: reject position changes exceeding threshold
- Duplicate action detection: reject actions faster than cooldown
