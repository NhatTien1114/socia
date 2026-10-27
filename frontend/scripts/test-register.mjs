import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import ts from 'typescript'
// Sandbox fallback: transpile in-process without esbuild/test-worker child processes.
// Run one test file at a time so each DOM suite keeps its own globals.
// Type checking remains the responsibility of tsc / npm run build.
const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate
    if (specifier.startsWith('@/')) candidate = path.join(sourceRoot, specifier.slice(2))
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) candidate = fileURLToPath(new URL(specifier, context.parentURL))
    if (candidate) {
      for (const suffix of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const file = candidate + suffix
        if (existsSync(file) && /\.(tsx?|mjs|js)$/.test(file)) return { url: pathToFileURL(file).href, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.tsx?$/.test(url) && !url.includes('/node_modules/')) {
      const fileName = fileURLToPath(url)
      const result = ts.transpileModule(readFileSync(fileName, 'utf8'), { fileName, compilerOptions: {
        module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
      } })
      return { source: result.outputText, format: 'module', shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})
