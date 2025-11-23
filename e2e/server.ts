import express from "express";
import path from "path";
import http from "http";
import fs from "fs";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const HUB_HTML_PATH = path.join(PROJECT_ROOT, "hub.html");
const E2E_DIR = path.join(PROJECT_ROOT, "e2e");
const CLIENT_TEMPLATE_PATH = path.join(E2E_DIR, "client-harness.html");
const CLIENT_TEMPLATE = fs.readFileSync(CLIENT_TEMPLATE_PATH, "utf8");

const DEFAULT_HUB_HEADERS: Record<string, string> = {
  "Cross-Origin-Resource-Policy": "cross-origin",
};

const DEFAULT_CLIENT_HEADERS: Record<string, string> = {
  "Cross-Origin-Embedder-Policy": "credentialless",
};

export const TEST_RESULT_KEY = "__iframeStorageE2EResult__";
export const HARNESS_STORAGE_KEY = "iframe-storage-e2e";
export const HARNESS_STORAGE_VALUE = "value-from-client";
export const HARNESS_IFRAME_TIMEOUT_MS = 700;

export type ServerOptions = {
  hubHeaders?: Record<string, string>;
  clientHeaders?: Record<string, string>;
};

export type RunningServers = {
  clientOrigin: string;
  hubOrigin: string;
  close: () => Promise<void>;
};

export async function startTestServers(
  options: ServerOptions = {}
): Promise<RunningServers> {
  const hubHeaders = { ...DEFAULT_HUB_HEADERS, ...(options.hubHeaders ?? {}) };
  const clientHeaders = {
    ...DEFAULT_CLIENT_HEADERS,
    ...(options.clientHeaders ?? {}),
  };
  const hubApp = express();
  hubApp.use("/dist", express.static(DIST_DIR));
  hubApp.get("/hub.html", (req, res) => {
    res.set({
      "Cache-Control": "no-store",
      ...hubHeaders,
    });
    res.sendFile(HUB_HTML_PATH);
  });

  const hubServerInfo = await listen(hubApp);
  const hubOrigin = `http://127.0.0.1:${hubServerInfo.port}`;

  const clientApp = express();
  clientApp.use("/dist", express.static(DIST_DIR));
  clientApp.get("/", (req, res) => {
    res.set({
      "Cache-Control": "no-store",
      ...clientHeaders,
    });
    res.type("html");
    res.send(renderClientHtml(`${hubOrigin}/hub.html`));
  });

  const clientServerInfo = await listen(clientApp);
  const clientOrigin = `http://127.0.0.1:${clientServerInfo.port}`;

  return {
    clientOrigin,
    hubOrigin,
    close: async () => {
      await Promise.all([
        closeServer(clientServerInfo.server),
        closeServer(hubServerInfo.server),
      ]);
    },
  };
}

function renderClientHtml(hubUrl: string): string {
  const config = {
    hubUrl,
    resultKey: TEST_RESULT_KEY,
    storageKey: HARNESS_STORAGE_KEY,
    storageValue: HARNESS_STORAGE_VALUE,
    iframeTimeoutMs: HARNESS_IFRAME_TIMEOUT_MS,
  };
  return CLIENT_TEMPLATE.replace("__HARNESS_CONFIG__", JSON.stringify(config));
}

function listen(
  app: express.Express
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to determine server address"));
        return;
      }
      resolve({ server, port: address.port });
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
