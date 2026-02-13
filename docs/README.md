# Sword Art Online: Aincrad Online
## Game Development Documentation

**Version:** 1.0.0  
**Last Updated:** February 2026

---

## Overview

This folder contains the complete planning documentation for **Aincrad Online** - a browser-based MMORPG inspired by Sword Art Online.

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Product Requirements](./01-PRODUCT_REQUIREMENTS.md) | Complete PRD with SAO lore, game mechanics, features |
| 02 | [Architecture Design](./02-ARCHITECTURE.md) | System architecture with Bun + Effect-TS |
| 03 | [Database Design](./03-DATABASE_DESIGN.md) | PostgreSQL, Redis, TimescaleDB schemas |
| 04 | [API/Network Protocol](./04-API_NETWORK_PROTOCOL.md) | WebSocket messages, binary protocol |
| 05 | [Security Architecture](./05-SECURITY.md) | Anti-cheat, server-authoritative design |
| 06 | [Deployment Infrastructure](./06-DEPLOYMENT.md) | Kubernetes, CI/CD, monitoring |
| 07 | [Development Roadmap](./07-ROADMAP.md) | 15-month development plan |

## Quick Start

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Backend** | Effect-TS |
| **WebSocket** | Bun native WebSocket |
| **Database** | PostgreSQL + Redis + TimescaleDB |
| **Frontend** | React + PixiJS |
| **Infrastructure** | Kubernetes + Docker |

### Key Design Principles

1. **Server-Authoritative** - Server is the ONLY source of truth
2. **Security First** - Zero tolerance for cheating
3. **SAO Authenticity** - Faithful to Sword Art Online game mechanics
4. **Browser-Native** - No downloads required

## SAO Game Mechanics Summary

### Core Systems

- **100 Floors** - Aincrad floating castle progression
- **Sword Skills** - Pre-motion → Execution → Post-motion → Cooldown
- **Party System** - 6 players per party, 48 for raids
- **Enhancement** - 5 parameters per equipment piece
- **Economy** - Col currency with trading/auction house

### Character Progression

- **Levels 1-100** with stat allocation
- **6 Base Stats** - STR, AGI, VIT, DEX, INT, LCK
- **Multiple Weapon Types** - Swords, rapiers, daggers, spears, bows
- **Skill Proficiency** - Level skills by usage

## Development Timeline

```
Phase 0: Foundation      (Months 1-2)   - Technical setup
Phase 1: Core Gameplay   (Months 3-5)   - Combat, monsters, inventory
Phase 2: Social/Economy  (Months 6-8)   - Party, trade, guilds
Phase 3: Content         (Months 9-12)  - Floors 2-25, crafting
Phase 4: Polish/Launch   (Months 13-15) - Optimization, launch

Target Launch: Q1 2027
```

## Security Architecture

### Anti-Cheat Measures

- Server-side movement validation
- Speed hack detection
- Teleportation prevention
- Combat range validation
- Input rate limiting
- Economy manipulation detection

### Network Security

- WSS (WebSocket Secure) mandatory
- Origin validation (CSWSH protection)
- JWT authentication with short expiration
- Rate limiting per connection
- Message signing

## Getting Started with Development

```bash
# Clone repository
git clone https://github.com/your-org/aincrad-online.git

# Install dependencies
bun install

# Set up environment
cp .env.example .env

# Start development
bun run dev
```

## Contributing

See individual documents for architecture decisions and implementation guidelines.

---

## References

- [Effect-TS Documentation](https://effect.website)
- [Bun WebSocket Docs](https://bun.com/docs/runtime/http/websockets)
- [Sword Art Online Wiki](https://swordartonline.fandom.com)
- [OWASP WebSocket Security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)

---

**Document Version:** 1.0.0  
**Status:** Planning Complete - Ready for Implementation
