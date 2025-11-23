import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from "util";
import "fake-indexeddb/auto";

if (typeof globalThis.TextEncoder === "undefined") {
  // JSDOM in Node lacks the browser globals, so expose the Node versions for tests.
  Object.defineProperty(globalThis, "TextEncoder", {
    configurable: true,
    writable: true,
    value: NodeTextEncoder as unknown as typeof globalThis.TextEncoder,
  });
}

if (typeof globalThis.TextDecoder === "undefined") {
  // Same as above for TextDecoder to keep polyfills and deps happy.
  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    writable: true,
    value: NodeTextDecoder as unknown as typeof globalThis.TextDecoder,
  });
}
