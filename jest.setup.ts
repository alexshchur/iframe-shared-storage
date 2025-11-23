import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from "util";
import "fake-indexeddb/auto";

if (typeof globalThis.TextEncoder === "undefined") {
  Object.defineProperty(globalThis, "TextEncoder", {
    configurable: true,
    writable: true,
    value: NodeTextEncoder as unknown as typeof globalThis.TextEncoder,
  });
}

if (typeof globalThis.TextDecoder === "undefined") {
  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    writable: true,
    value: NodeTextDecoder as unknown as typeof globalThis.TextDecoder,
  });
}
