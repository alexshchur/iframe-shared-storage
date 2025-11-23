import { JSDOM } from "jsdom";

type WindowLike = Window & typeof globalThis;

const WINDOW_KEYS = [
  "window",
  "self",
  "document",
  "navigator",
  "addEventListener",
  "removeEventListener",
  "MessageEvent",
  "Event",
  "CustomEvent",
  "HTMLElement",
  "HTMLIFrameElement",
  "HTMLBodyElement",
  "EventTarget",
  "Node",
  "DOMException",
  "performance",
  "getComputedStyle",
] as const;

let currentWindow: WindowLike | undefined;

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  get() {
    return currentWindow?.localStorage;
  },
});

Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  get() {
    return currentWindow?.sessionStorage;
  },
});

type WindowSnapshot = {
  values: Partial<Record<(typeof WINDOW_KEYS)[number], unknown>>;
  currentWindow?: WindowLike | undefined;
};

function captureSnapshot(): WindowSnapshot {
  const values: Partial<Record<(typeof WINDOW_KEYS)[number], unknown>> = {};
  for (const key of WINDOW_KEYS) {
    values[key] = (globalThis as Record<string, unknown>)[key];
  }
  return { values, currentWindow };
}

function applyWindow(win: WindowLike) {
  for (const key of WINDOW_KEYS) {
    (globalThis as Record<string, unknown>)[key] = (
      win as unknown as Record<string, unknown>
    )[key];
  }
  currentWindow = win;
}

function restoreWindow(snapshot: WindowSnapshot) {
  for (const key of WINDOW_KEYS) {
    (globalThis as Record<string, unknown>)[key] = snapshot.values[key];
  }
  currentWindow = snapshot.currentWindow;
}

function useWindow<T>(win: WindowLike, fn: () => T): T {
  const snapshot = captureSnapshot();
  applyWindow(win);
  try {
    return fn();
  } finally {
    restoreWindow(snapshot);
  }
}

function linkPostMessage(parent: WindowLike, child: WindowLike) {
  const parentPostMessage = parent.postMessage.bind(parent);
  const childPostMessage = child.postMessage.bind(child);

  const forward = (target: WindowLike, source: WindowLike) => {
    return (data: unknown) => {
      setTimeout(() => {
        const event = new target.MessageEvent("message", {
          data,
          origin: source.location.origin,
          source,
        });
        useWindow(target, () => {
          target.dispatchEvent(event);
        });
      }, 0);
    };
  };

  parent.postMessage = forward(parent, child) as Window["postMessage"];
  child.postMessage = forward(child, parent) as Window["postMessage"];

  return () => {
    parent.postMessage = parentPostMessage;
    child.postMessage = childPostMessage;
  };
}

type LinkedWindowOptions = {
  iframeId: string;
  parentUrl: string;
  hubUrl: string;
};

function setupLinkedWindows({
  iframeId,
  parentUrl,
  hubUrl,
}: LinkedWindowOptions) {
  const parentDom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: parentUrl,
    pretendToBeVisual: true,
  });
  const childDom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: hubUrl,
    pretendToBeVisual: true,
  });

  const parent = parentDom.window as unknown as WindowLike;
  const child = childDom.window as unknown as WindowLike;

  Object.defineProperty(child, "parent", {
    configurable: true,
    value: parent,
  });
  Object.defineProperty(parent, "parent", {
    configurable: true,
    value: parent,
  });

  const restorePostMessage = linkPostMessage(parent, child);

  const iframe = parent.document.createElement("iframe");
  iframe.id = iframeId;
  parent.document.body.appendChild(iframe);

  Object.defineProperty(iframe, "contentWindow", {
    configurable: true,
    value: child,
  });
  Object.defineProperty(iframe, "contentDocument", {
    configurable: true,
    value: child.document,
  });

  const { indexedDB, IDBKeyRange } = globalThis as typeof globalThis & {
    indexedDB: IDBFactory;
    IDBKeyRange: any;
  };

  Object.assign(parent, { indexedDB, IDBKeyRange });
  Object.assign(child, { indexedDB, IDBKeyRange });

  return {
    parent,
    child,
    cleanup: () => {
      restorePostMessage();
      parent.close();
      child.close();
    },
  };
}

export type ClientHubSandboxOptions = Partial<LinkedWindowOptions>;

export type ClientHubSandboxContext = {
  iframeId: string;
  parent: WindowLike;
  child: WindowLike;
  runInParent<T>(fn: () => T): T;
  runInChild<T>(fn: () => T): T;
};

export const DEFAULT_IFRAME_ID = "integration-frame";

const DEFAULT_PARENT_URL = "http://client.test";
const DEFAULT_HUB_URL = "https://hub.test";

export async function withClientHubSandbox<T>(
  fn: (ctx: ClientHubSandboxContext) => Promise<T> | T,
  options: ClientHubSandboxOptions = {}
): Promise<T> {
  const {
    iframeId = DEFAULT_IFRAME_ID,
    parentUrl = DEFAULT_PARENT_URL,
    hubUrl = DEFAULT_HUB_URL,
  } = options;

  const { parent, child, cleanup } = setupLinkedWindows({
    iframeId,
    parentUrl,
    hubUrl,
  });
  const snapshot = captureSnapshot();
  applyWindow(parent);

  try {
    return await fn({
      iframeId,
      parent,
      child,
      runInParent: <R>(cb: () => R) => useWindow(parent, cb),
      runInChild: <R>(cb: () => R) => useWindow(child, cb),
    });
  } finally {
    restoreWindow(snapshot);
    cleanup();
  }
}
