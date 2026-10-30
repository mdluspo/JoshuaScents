import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const nativeRequire = createRequire(path.join(projectRoot, 'package.json'));
const ts = nativeRequire('typescript');

// Load real API TypeScript with isolated env and mocked providers. These tests
// never use .env.local, live credentials, a database, or network access.
export function loadApi(entry, { env = {}, overrides = {}, fetch: mockFetch } = {}) {
  const cache = new Map();
  const logs = [];
  const context = vm.createContext({ Buffer, URL, URLSearchParams, AbortSignal, Headers, Request, Response, TextDecoder, TextEncoder, Error, TypeError, Date, Math, JSON, setTimeout, clearTimeout,
    process: { env: { NODE_ENV: 'test', ...env } }, console: { error: (...args) => logs.push(args), log() {}, warn() {} },
    fetch: mockFetch ?? (async () => { throw new Error('Network access is forbidden in tests'); }) });
  function load(file) {
    const absolute = path.resolve(projectRoot, file);
    const key = path.relative(projectRoot, absolute).replaceAll('\\', '/');
    if (Object.hasOwn(overrides, key)) return overrides[key];
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} }; cache.set(absolute, module);
    const source = fs.readFileSync(absolute, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireLocal = specifier => Object.hasOwn(overrides, specifier) ? overrides[specifier] : specifier.startsWith('.') ? load(path.relative(projectRoot, path.resolve(path.dirname(absolute), specifier.replace(/\.js$/, '.ts')))) : nativeRequire(specifier);
    vm.runInContext(`(function(require,module,exports){${compiled}\n})`, context, { filename: absolute })(requireLocal, module, module.exports);
    return module.exports;
  }
  return { module: load(entry), load, logs };
}
export function mockRequest(options = {}) {
  return { method: 'POST', url: '/api/test', query: {}, body: {}, headers: { 'content-type': 'application/json', host: 'localhost:5173' }, socket: { remoteAddress: '127.0.0.1' }, ...options };
}
export function mockResponse() {
  return { statusCode: 200, headers: {}, body: undefined, setHeader(key, value) { this.headers[key.toLowerCase()] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
