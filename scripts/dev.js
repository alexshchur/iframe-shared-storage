#!/usr/bin/env node
const { spawn } = require("child_process");

function run(cmd, args, name) {
  const p = spawn(cmd, args, { stdio: "pipe", shell: false });
  p.stdout.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on("data", (d) => process.stderr.write(`[${name}] ${d}`));
  p.on("exit", (code, signal) => {
    console.log(
      `[${name}] exited with code ${code}${signal ? ` signal ${signal}` : ""}`
    );
    // If any process exits, shut down all
    process.exitCode = process.exitCode || code || 1;
    shutdown();
  });
  return p;
}

let procs = [];
function shutdown() {
  for (const p of procs) {
    try {
      p.kill("SIGINT");
    } catch {}
    try {
      p.kill("SIGTERM");
    } catch {}
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

procs.push(run("npm", ["run", "build:watch"], "build"));
procs.push(
  run(
    "node",
    [
      "scripts/server.js",
      "--file",
      "hub.html",
      "--port",
      "5001",
      "--host",
      "0.0.0.0",
    ],
    "hub"
  )
);
procs.push(
  run(
    "node",
    [
      "scripts/server.js",
      "--file",
      "client.html",
      "--port",
      "5000",
      "--host",
      "0.0.0.0",
    ],
    "client"
  )
);

// Keep process alive
setInterval(() => {}, 1 << 30);
