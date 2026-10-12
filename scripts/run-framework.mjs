// `pnpm dev` / `pnpm build`: run the vinext CLI in this process, so a preview owner keeps its PID and signals.
// dev listens on 127.0.0.1:5173 unless --port/--hostname are passed (`pnpm dev --port 3000`).
import { rmSync } from "node:fs";
import { Socket } from "node:net";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");

if (command === "build") {
  // vinext ends a successful build with process.exit(0) (failures exit non-zero and are passed straight through).
  const exit = process.exit.bind(process);
  process.exit = (code) => {
    if (code !== undefined && code !== 0) return exit(code);
    // Vite's build manifest lists source file paths and is not needed at run time: keep it out of the published folder.
    rmSync(new URL("../dist/client/.vite", import.meta.url), { recursive: true, force: true });
    if (process.platform !== "win32") return exit(0);
    // On Windows, exiting while vinext's prerender server is still closing a keep-alive connection aborts Node
    // (libuv assertion in src\win\async.c) after the build has succeeded. Close those sockets first, then exit.
    const stdio = new Set([process.stdin, process.stdout, process.stderr]);
    for (const handle of process._getActiveHandles()) {
      if (handle instanceof Socket && !stdio.has(handle)) handle.destroy();
    }
    process.exitCode = 0;
    setTimeout(() => exit(0), 250);
  };
}

const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
// IPv4 loopback explicitly: "localhost" can resolve to ::1 only on Windows. Later arguments override these defaults.
const devDefaults = command === "dev" ? ["--port", "5173", "--hostname", "127.0.0.1"] : [];
process.argv = [process.execPath, fileURLToPath(cli), command, ...devDefaults, ...args];
await import(cli.href);
