// Exists only so Jest (via babel-jest, already a transitive dependency of
// jest itself) can transpile the one ESM-only package the app pulls in
// transitively — sanitize-html depends on htmlparser2@12, which ships as
// "type": "module" with no CommonJS build. See jest.config.js's
// transformIgnorePatterns for the matching half of this fix. This has no
// effect on how the app actually runs in development/production (Node runs
// the real source files directly, untouched by Babel) — it only affects how
// Jest loads modules while running the test suite.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
