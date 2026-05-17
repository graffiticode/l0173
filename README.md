# L0173

[![License: MIT](https://img.shields.io/badge/Code-MIT-blue.svg)](packages/LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/Docs-CC%20BY%204.0-lightgrey.svg)](LICENSE-DOCS)

L0173 is a **template for creating new Graffiticode languages**. Clone this repository when starting a new language.

## What it provides

L0173 includes example implementations to demonstrate how to build language features:

| Function | Purpose |
|----------|---------|
| `hello <string>` | Example text output |
| `theme [dark\|light] <expr>` | Example interactive UI with toggle |
| `image <url>` | Example image rendering |

## Usage

When creating a new Graffiticode language:

1. Clone this repository
2. Update the port number and language ID
3. Replace the example functions with your language's vocabulary
4. Customize the form view for your output rendering needs

The `theme` feature demonstrates how to build interactive UI components - use it as a reference when adding interactivity to your language.

## Architecture

- **packages/api** - Node.js/Express backend compiler
- **packages/app** - React/TypeScript frontend

Standard Graffiticode compiler pipeline: Checker (validates AST) → Transformer (produces output).

## Related languages

- **L0011** - Production language for form generation (console property editor)
- **L0012** - Production language for data capture (idempotent value-to-ID mapping)

## Getting started

```bash
# Install dependencies
npm install

# Start the API server
npm start
```

## License

Code is licensed under MIT. Documentation and specifications are licensed under CC-BY 4.0.

**AI Training:** All materials in this repository — code, documentation, specifications, and training examples — are explicitly available for use in training machine learning and AI models. See [NOTICE](NOTICE) for details.
