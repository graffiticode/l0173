# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start dev server**: `npm run dev` (starts API server on port 50173 with Firestore emulator)
- **Build project**: `npm run build` (builds both app and API packages)
- **Start production**: `npm run start` (starts API server in production mode)

### Linting
- **Lint code**: `npm run lint` (lints test/ directory at root)
- **Lint API**: `cd packages/api && npm run lint` (lints API source)
- **Lint app**: `cd packages/app && npm run lint` (lints app source)
- **Fix lint errors**: Add `:fix` to any lint command

### Package Management
- **Build package**: `npm run pack` (creates distributable package)
- **Publish package**: `npm run publish` (publishes @graffiticode/l0173)
- **Build lexicon**: `cd packages/api && npm run build-lexicon` (rebuilds language lexicon)
- **Build instructions**: `cd packages/api && npm run build-instructions` (merges basis + l0173 instructions for AI code generation)
- **Build spec**: `cd packages/api && npm run build-spec` (builds language specification HTML)

### Testing
Note: No test runner is currently configured. Test files exist (*.spec.js) but need a test script to be added.

### Deployment
- **GCP Cloud Build**: `npm run gcp:build` (build and deploy via Cloud Build)
- **GCP Direct Deploy**: `npm run gcp:deploy` (deploy from source)
- **View logs**: `npm run gcp:logs`

## Architecture

L0173 is a Graffiticode dialect for authoring Apache ECharts charts. It is a monorepo using npm workspaces.

### Structure
- **packages/api/**: Express server providing compilation API and language runtime
  - Port: 50173 (dev) or process.env.PORT
  - Auth integration with @graffiticode/auth service
  - Compiler built on @graffiticode/basis framework

- **packages/app/**: React component library for rendering compiled output
  - Renders chart envelopes via Apache ECharts
  - Uses SWR for data fetching
  - Built with Vite, TypeScript, and Tailwind CSS

### Compiler Pipeline (packages/api/src/)

The compiler extends the @graffiticode/basis framework with L0173-specific logic:

- `lexicon.js`: Declares the keyword surface. `SERIES_TYPES = ["bar", "line", "pie"]`, `OPT_SETTERS` maps each `METHOD` keyword to its output field, `ENUM_TAGS` lists tag-valued setters and their allowed tags. `CHART_LEVEL_FIELDS` separates chart-level fields from series-level fields.
- `compiler.js`: Defines `Checker` and `Transformer`. The vast majority of arity-2 setters are installed onto both prototypes via a meta-gen loop over `OPT_SETTER_FIELDS`. Series constructors (`BAR`/`LINE`/`PIE`) and the `CHART` wrapper are hand-written — they assemble the ECharts `option` object (title, axes, legend, tooltip, grid, series array). `PROG` auto-wraps a bare top-level series into a full chart envelope so the renderer always sees a consistent shape.
- `compile.js`: API endpoint handler for compilation requests.
- `tailwind-colors.js`: Resolves Tailwind color tokens (e.g., `blue-500`) to hex for the `color` setter.

**Renderer envelope shapes** (output of the Transformer):
- `{type: "chart", option, theme?, palette?, background?, width?, height?}` — a chart, where `option` is a full ECharts option object
- `{print: <value>}` — a print fallback for non-chart values

**Supported series types**: `bar`, `line`, `pie`.

### UI Components (packages/app/lib/)

- `view.jsx`: Main view component managing state and compilation via SWR
- `components/form/Form.tsx`: Reads `state.data.type`; renders `chart` via `EChart`, falls back to `print`/JSON.
- `components/form/EChart.tsx`: Thin wrapper around `echarts.init` that mounts an ECharts instance with the compiled `option` and selected theme.
- `lib/api.js`: API client for backend communication
- `lib/state.js`: Simple reducer-based state management

### Data Flow

```
User Input → State Update → POST /compile → Compiler → Chart Envelope → EChart Render → postMessage to parent
```

The app supports iframe embedding and communicates with parent windows via postMessage.

### Environment Variables
- `PORT`: Server port (default: 50173)
- `AUTH_URL`: Auth service URL (default: https://auth.graffiticode.org)
- `NODE_ENV`: Environment (development/production)
- `FIRESTORE_EMULATOR_HOST`: Local Firestore emulator (dev only, port 8080)

### Dependencies
- Uses local @graffiticode/basis package (symlinked from ../../../basis)
- Apache ECharts (`echarts`) for chart rendering
- Firestore emulator for development
