# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start dev server**: `npm run dev` (starts API server on port 50173 with Firestore emulator)
- **Build project**: `npm run build` (builds the app, the API, and the static language artifacts in `dist/` via `build-static`)
- **Start production**: `npm run start` (starts API server in production mode)

### Linting
- **Lint code**: `npm run lint` (runs the API and app lint scripts in sequence)
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
Jest is installed at the repo root, but there is no `test` npm script and the
root jest config (`package.json`) ignores `packages/`. The specs are ESM, so
run them directly with the VM-modules flag and an overridden root. The
compiler spec is the one that matters for language work:

```bash
# Run the full compiler spec
NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathIgnorePatterns="/node_modules/" --roots=packages/api/src \
  --testMatch="**/compiler.spec.js"

# Run a single test (add -t with a name substring)
NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathIgnorePatterns="/node_modules/" --roots=packages/api/src \
  --testMatch="**/compiler.spec.js" -t "label-formatter"
```

`compiler.spec.js` parses L0173 source via `@graffiticode/parser` against the
merged basis + l0173 lexicon and asserts on the resulting ECharts envelope —
this is the fastest feedback loop when changing the compiler or lexicon. The
other specs (`auth`, `app`) depend on services that aren't ESM-transformed and
won't run cleanly this way.

Note: `npm run lint` currently reports pre-existing errors across spec/tool
files (the eslint config doesn't declare jest/node globals). Lint individual
source files (`npx eslint src/compiler.js src/lexicon.js`) to check your own
changes in isolation.

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

- `lexicon.js`: Declares the keyword surface. `SERIES_TYPES = ["bar", "line", "pie", "scatter"]`, `OPT_SETTERS` maps each `METHOD` keyword to its output field, `ENUM_TAGS` lists tag-valued setters and their allowed tags. `CHART_LEVEL_FIELDS` separates chart-level fields from series-level fields. **Adding a setter** is usually just one `OPT_SETTERS` entry (surface keyword and field name are derived from the `METHOD` key) plus, if it takes a fixed tag set, an `ENUM_TAGS` entry — the compiler meta-generates the Checker/Transformer for it. Hand-written compiler logic is only needed when the value must be reshaped for ECharts (see `renderSeries`/`renderAxis`).
- `compiler.js`: Defines `Checker` and `Transformer`. The vast majority of arity-2 setters are installed onto both prototypes via a meta-gen loop over `OPT_SETTER_FIELDS`. Series constructors (`BAR`/`LINE`/`PIE`, plus `SCATTER` which overrides its Transformer to default both axes to numeric) and the `CHART` wrapper are hand-written — they assemble the ECharts `option` object (title, axes, legend, tooltip, grid, series array). The flat surface setters are translated into nested ECharts shapes in the render helpers: `renderSeries` (data labels, color, pie radius, dual-y binding), `renderAxis` (`categories`→`data`, `rotate`→`axisLabel.rotate`), `renderLegend`, `renderTooltip`. `PROG` auto-wraps a bare top-level series into a full chart envelope so the renderer always sees a consistent shape.
- `compile.js`: API endpoint handler for compilation requests.
- `tailwind-colors.js`: Resolves Tailwind color tokens (e.g., `blue-500`) to hex for the `color` setter.

**Renderer envelope shapes** (output of the Transformer):
- `{type: "chart", option, theme?, palette?, background?, width?, height?}` — a chart, where `option` is a full ECharts option object
- `{print: <value>}` — a print fallback for non-chart values

**Supported series types**: `bar`, `line`, `pie`, `scatter`.

### Language spec & the AI code generator (packages/api/spec/)

Charts are authored in two ways: a human writes L0173 directly, **or** an AI
backend generates L0173 from a natural-language prompt (the MCP
`create_item`/`update_item` flow). That generator is steered entirely by the
prose in `packages/api/spec/`, so a language change isn't done until the spec
is updated too:

- `spec.md` — the canonical setter reference (the tables of keywords/values).
- `instructions.md` — authoring rules, including an "ECharts reflex → L0173"
  table that redirects shapes a model would naively emit (e.g.
  `label: { formatter }`) to the real flat setter (`label-formatter`).
- `examples.md` — natural-language → L0173 RAG training prompts, grouped by
  category.

`npm run build-static` compiles these into `packages/api/dist/`
(`build-lexicon`, `build-spec`, `build-instructions` — which merges basis +
l0173 instructions — and `build-language-info`). **`dist/` is not git-tracked**;
it is rebuilt from `spec/` during the Cloud Build deploy. So editing a language
feature means touching: `lexicon.js`, `compiler.js`, a `compiler.spec.js` test,
**and** the three `spec/*.md` files — otherwise the generator keeps emitting the
old (or missing) syntax.

A practical heuristic: if the AI generator reaches for a keyword that doesn't
exist, prefer implementing that keyword to match its vocabulary over inventing
a different syntax (this is how `label-formatter` was added).

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
