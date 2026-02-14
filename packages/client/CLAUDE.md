# Client Package

- Clean Architecture: domain → ports → application → adapters
- Domain: `src/domain/` — pure TS entities, value objects
- Ports: `src/ports/` — NetworkPort, RendererPort, AudioPort interfaces
- Application: `src/application/` — use cases + Zustand stores
- Adapters: `src/adapters/` — WebSocket, PixiJS, React components
- React components are adapters — they consume Zustand stores, never domain logic
- PixiJS rendering goes through RendererPort, never direct PIXI calls in use cases
