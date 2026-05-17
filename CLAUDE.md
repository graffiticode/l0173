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

This is a Graffiticode language implementation (L0173) with a monorepo structure using npm workspaces.

### Structure
- **packages/api/**: Express server providing compilation API and language runtime
  - Port: 50173 (dev) or process.env.PORT
  - Auth integration with @graffiticode/auth service
  - Compiler built on @graffiticode/basis framework

- **packages/app/**: React component library for rendering compiled output
  - Exports Form component and related UI
  - Uses SWR for data fetching
  - Built with Vite, TypeScript, and Tailwind CSS

### Compiler Pipeline (packages/api/src/)

The compiler extends the @graffiticode/basis framework with L0173-specific logic:

- `compiler.js`: Defines `Checker` and `Transformer` classes extending Basis
  - Checker validates AST nodes (e.g., THEME tag must be "dark" or "light")
  - Transformer converts AST to output data objects
- `compile.js`: API endpoint handler for compilation requests
- `lexicon.js`: Language vocabulary definitions

**Language Functions**:
| Function | Signature | Description |
|----------|-----------|-------------|
| `hello` | `<string>` | Renders "hello, {string}!" message |
| `theme` | `[dark\|light] <record>` | Sets UI theme with toggle button |
| `image` | `<string>` | Renders image from URL |

### UI Components (packages/app/lib/)

- `view.jsx`: Main view component managing state and compilation via SWR
- `components/form/Form.tsx`: Form component with theme support and conditional rendering
- `lib/api.js`: API client for backend communication
- `lib/state.js`: Simple reducer-based state management

### Data Flow

```
User Input → State Update → POST /compile → Compiler → Output Data → Form Render → postMessage to parent
```

The app supports iframe embedding and communicates with parent windows via postMessage.

### Environment Variables
- `PORT`: Server port (default: 50173)
- `AUTH_URL`: Auth service URL (default: https://auth.graffiticode.org)
- `NODE_ENV`: Environment (development/production)
- `FIRESTORE_EMULATOR_HOST`: Local Firestore emulator (dev only, port 8080)

### Dependencies
- Uses local @graffiticode/basis package (symlinked from ../../../basis)
- Firestore emulator for development