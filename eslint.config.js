'use strict';
const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');
const globals = require('globals');

// js/*.js are classic scripts sharing one global scope. Each file sees the top-level names
// declared in the other files as globals; declaring the same name in two files is reported by no-redeclare.
const APP_DIR = path.join(__dirname, 'js');
const appFiles = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.js'));
function topLevelNames(file) {
  const src = fs.readFileSync(path.join(APP_DIR, file), 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/^function\s+([\w$]+)/gm)) names.add(m[1]);
  // top-level `var a = …, b = …;` (continuation lines are indented by two spaces)
  for (const m of src.matchAll(/^var\s([\s\S]*?);\s*$/gm)) {
    for (const d of m[1].matchAll(/(?:^|,\s*\n?\s*)([A-Za-z_$][\w$]*)\s*(?==|,|$)/g)) names.add(d[1]);
  }
  return names;
}
const namesByFile = Object.fromEntries(appFiles.map(f => [f, topLevelNames(f)]));

const browser = {
  ...globals.browser,
  ...globals.serviceworker,
  supabase: 'readonly',
  PulseCore: 'readonly',
  module: 'readonly'
};
const appRules = {
  'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
  'no-empty': ['error', { allowEmptyCatch: true }]
};

module.exports = [
  { ignores: ['vendor/**', 'private/**', 'node_modules/**', 'supabase/**', 'docs/**'] },
  js.configs.recommended,
  ...appFiles.map(file => {
    const shared = {};
    for (const [other, names] of Object.entries(namesByFile)) {
      if (other !== file) for (const n of names) shared[n] = 'writable';
    }
    return {
      files: ['js/' + file],
      languageOptions: { ecmaVersion: 2017, sourceType: 'script', globals: { ...browser, ...shared } },
      rules: appRules
    };
  }),
  {
    files: ['lib/**/*.js', 'config.js', 'sw.js'],
    languageOptions: { ecmaVersion: 2017, sourceType: 'script', globals: browser },
    rules: appRules
  },
  {
    files: ['tests/**/*.js', 'tools/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } }
  }
];
