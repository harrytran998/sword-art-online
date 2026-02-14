---
paths:
  - "packages/client/src/**/*.ts"
  - "packages/client/src/**/*.tsx"
---

# Frontend Clean Architecture

## Layer Structure
- `src/domain/` — Pure TS entities and value objects (Position, Character, Item)
- `src/ports/` — Interfaces: NetworkPort, RendererPort, AudioPort, StoragePort
- `src/application/` — Use cases + Zustand stores (GameStore, InventoryStore, ChatStore)
- `src/adapters/` — Implementations: WebSocket, PixiJS renderer, React components

## Rules
- React components are ADAPTERS — they consume Zustand stores, never domain logic directly
- PixiJS rendering goes through RendererPort, never direct PIXI calls in use cases
- WebSocket communication goes through NetworkPort interface
- Domain layer has ZERO dependencies on React, PixiJS, or any framework

## State Management
- Zustand stores live in `src/application/stores/`
- Each store corresponds to a game system (combat, inventory, social, etc.)
- Stores call use cases, which call ports — never the reverse

## Component Structure
- `src/adapters/ui/components/` — Reusable UI components
- `src/adapters/ui/screens/` — Full screen layouts
- `src/adapters/ui/hud/` — In-game HUD overlays
- `src/adapters/renderer/` — PixiJS rendering adapter
