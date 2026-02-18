# Expo Web White Screen — `import.meta` SyntaxError

## Symptom
- **White screen** on Expo web (`npx expo start --web`)
- **No errors in F12 Console** — zero JavaScript executes
- Hard reload (`Ctrl+Shift+R`) and new port don't help
- Metro bundler reports **no build errors** (e.g. "Bundled 793ms, 801 modules")
- Native (Android/iOS) may still work fine

## Root Cause
Some npm packages use `import.meta.env` (ES module syntax). Metro bundles everything into a **regular `<script>` tag** (not `type="module"`). The browser's parser throws a **SyntaxError** when it encounters `import.meta` anywhere in a non-module script — this happens at **parse time**, before any JS runs, so:
- React never mounts → white screen
- No error handlers are registered yet → nothing in Console
- The error may only flash briefly in the Console or appear as a subtle red text

## Known Offender
- **`zustand/middleware`** (v5.x) — the `devtools` function uses `import.meta.env.MODE`. Importing `{ persist, createJSONStorage }` from `zustand/middleware` pulls in the entire module including devtools code.

## How to Confirm
Use Playwright (or any headless browser) to capture the error:
```js
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
// Look for: "Cannot use 'import.meta' outside a module"
```

Or search the bundle directly:
```bash
curl -s "http://localhost:8081/index.ts.bundle?platform=web&dev=true&..." | grep -n "import\.meta"
# If any match is OUTSIDE a comment → that's the problem
```

## Fix
Add a `babel.config.js` at project root with a plugin that rewrites `import.meta` → `process`:

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require.resolve("babel-preset-expo")],
    plugins: [
      function importMetaEnvPlugin() {
        return {
          visitor: {
            MetaProperty(path) {
              path.replaceWithSourceString("process");
            },
          },
        };
      },
    ],
  };
};
```

Also need:
- `npm install -D babel-preset-expo` (must be a direct dependency, not just nested inside expo)
- `metro.config.js` (standard Expo default is fine)
- **Restart dev server with `--clear`**: `npx expo start --web --clear`

## Why This Works
- `import.meta.env.MODE` → `process.env.MODE` (metro already defines `process.env`)
- `import.meta.env` → `process.env` (safe fallback, same shape)
- Comments containing `import.meta` are untouched (babel only transforms AST nodes)
- Native builds are unaffected (they don't hit this code path)

## Checklist for Future White Screen Debugging
1. Check if bundle compiled OK (metro terminal output)
2. If bundle OK but white screen → **runtime parse/execution error**
3. Use Playwright/headless browser to capture `pageerror` events
4. Search bundle for `import.meta` outside comments: `grep -n "import\.meta" bundle.js`
5. If found → add the babel plugin above
6. If not found → check for other syntax issues incompatible with non-module scripts
