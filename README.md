# country-search

## Development

Install dependencies with `npm install`. Run `npm run lint`, `npm run format`,
`npm test`, or `npm run build` to lint, format, test, or compile the project.

Husky runs `lint-staged` on staged files before each commit. Before each push,
it runs `npm test`; an empty test suite is allowed while tests are being added.

## Run the app

Build the TypeScript modules with `npm run build`, then serve the project root
over HTTP (for example, `python -m http.server 8000`) and open
`http://localhost:8000`. The page loads the compiled module from `dist/`.
