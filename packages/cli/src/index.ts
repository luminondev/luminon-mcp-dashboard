#!/usr/bin/env node
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ManagedProcess {
  pid?: number;
  logPath?: string;
  startedAt?: string;
  mode?: "managed" | "stdio";
}

interface LockFile {
  dataDir: string;
  mcp?: ManagedProcess;
  renderer?: ManagedProcess;
}

type StartTarget = "stack" | "mcp" | "renderer";
type StopTarget = "stack" | "mcp" | "renderer";
type ManagedTarget = "mcp" | "renderer";
type McpMode = "full" | "lite" | "ultra-lite";
type RuntimeCommand = { command: string; args: string[]; env?: NodeJS.ProcessEnv };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const dataDir = resolveDataDir();
const lockPath = path.join(dataDir, ".luminon-lock.json");
const logsDir = path.join(dataDir, "logs");

function resolveDataDir(): string {
  const envDir = process.env.MCP_DATA_DIR?.trim();
  const expanded = envDir && envDir.startsWith("~") ? path.join(os.homedir(), envDir.slice(1)) : envDir;
  return expanded && expanded.length > 0 ? expanded : path.join(os.homedir(), "Documents", "luminon");
}

function ensureBaseDir(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
}

function readLock(): LockFile | null {
  try {
    return JSON.parse(fs.readFileSync(lockPath, "utf8")) as LockFile;
  } catch {
    return null;
  }
}

function writeLock(lock: LockFile): void {
  ensureBaseDir();
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), "utf8");
}

function removeLockIfEmpty(lock: LockFile): void {
  if (lock.mcp || lock.renderer) {
    writeLock(lock);
    return;
  }

  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

function pidAlive(pid?: number): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function processLabel(target: ManagedTarget): string {
  return target === "mcp" ? "MCP" : "Renderer";
}

function sanitizeProcess(proc?: ManagedProcess): ManagedProcess | undefined {
  if (!proc?.pid || !pidAlive(proc.pid)) return undefined;
  return proc;
}

function sanitizeLock(lock: LockFile | null): LockFile | null {
  if (!lock) return null;
  const sanitized: LockFile = {
    dataDir: lock.dataDir,
    mcp: sanitizeProcess(lock.mcp),
    renderer: sanitizeProcess(lock.renderer)
  };
  if (!sanitized.mcp && !sanitized.renderer) return null;
  return sanitized;
}

function loadLock(): LockFile {
  const sanitized = sanitizeLock(readLock());
  if (!sanitized) {
    return { dataDir };
  }
  if (!sanitized.mcp || !sanitized.renderer) {
    removeLockIfEmpty(sanitized);
  }
  return sanitized;
}

function updateManagedProcess(target: ManagedTarget, proc?: ManagedProcess): LockFile {
  const lock = loadLock();
  if (target === "mcp") {
    lock.mcp = proc;
  } else {
    lock.renderer = proc;
  }
  removeLockIfEmpty(lock);
  return lock;
}

function resolveRuntimeEntry(target: ManagedTarget): string {
  const entry =
    target === "mcp"
      ? path.join(repoRoot, "packages", "mcp-server", "dist", "index.js")
      : path.join(repoRoot, "packages", "renderer", "dist", "api-server.js");
  if (!fs.existsSync(entry)) {
    console.error(`Missing compiled ${processLabel(target)} runtime at ${entry}. Run 'npm run build' first.`);
    process.exit(1);
  }
  return entry;
}

function commandFor(target: ManagedTarget): RuntimeCommand {
  const runtimeEntry = resolveRuntimeEntry(target);
  if (target === "mcp") {
    return {
      command: process.execPath,
      args: [runtimeEntry]
    };
  }
  return {
    command: process.execPath,
    args: [runtimeEntry],
    env: {
      RENDERER_PORT: "5173",
      LUMINON_RENDERER_STATIC: "true"
    }
  };
}

function logPathFor(target: ManagedTarget): string {
  return path.join(logsDir, `${target}.log`);
}

function startManagedProcess(target: ManagedTarget): number {
  ensureBaseDir();
  const existing = loadLock();
  const current = target === "mcp" ? existing.mcp : existing.renderer;
  if (current?.pid && pidAlive(current.pid)) {
    console.error(`${processLabel(target)} is already running. Use 'luminon status' or 'luminon stop ${target}'.`);
    process.exit(1);
  }

  const runtime = commandFor(target);
  const { command, args } = runtime;
  const logPath = logPathFor(target);
  const logFd = fs.openSync(logPath, "a");
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: process.platform !== "win32",
    env: { ...process.env, MCP_DATA_DIR: dataDir, ...runtime.env },
    stdio: ["ignore", logFd, logFd]
  });
  fs.closeSync(logFd);

  if (process.platform !== "win32") {
    child.unref();
  }

  updateManagedProcess(target, {
    pid: child.pid,
    logPath,
    startedAt: new Date().toISOString(),
    mode: "managed"
  });

  console.log(`${processLabel(target)} started (pid ${child.pid ?? "unknown"}). Log: ${logPath}`);
  return child.pid ?? 0;
}

function stopManagedProcess(target: ManagedTarget): boolean {
  const lock = loadLock();
  const proc = target === "mcp" ? lock.mcp : lock.renderer;
  if (!proc?.pid || !pidAlive(proc.pid)) {
    updateManagedProcess(target, undefined);
    console.log(`${processLabel(target)} is already stopped.`);
    return false;
  }

  try {
    if (process.platform !== "win32") {
      process.kill(-proc.pid, "SIGTERM");
    } else {
      process.kill(proc.pid, "SIGTERM");
    }
  } catch {
    try {
      process.kill(proc.pid, "SIGTERM");
    } catch {
      // ignore
    }
  }

  updateManagedProcess(target, undefined);
  console.log(`${processLabel(target)} stopped.`);
  return true;
}

function printStatus(): void {
  const lock = loadLock();
  const mcp = sanitizeProcess(lock.mcp);
  const renderer = sanitizeProcess(lock.renderer);
  const lockExists = fs.existsSync(lockPath);

  console.log(`Data dir: ${dataDir}`);
  console.log(`Lock file: ${lockExists ? lockPath : "(none)"}`);
  console.log(
    `MCP: ${
      mcp?.pid
        ? `running (pid ${mcp.pid}, mode ${mcp.mode ?? "managed"}${mcp.logPath ? `, log ${mcp.logPath}` : ""})`
        : "host-managed or stopped (AI Tool stdio MCP may not appear here)"
    }`
  );
  console.log(
    `Renderer: ${
      renderer?.pid
        ? `running (pid ${renderer.pid}${renderer.logPath ? `, log ${renderer.logPath}` : ""})`
        : "stopped"
    }`
  );
}

function usage(): void {
  console.log(`Usage:
  luminon mcp [--mode MODE] # run MCP over stdio for an AI Tool
  luminon start renderer # serve the built renderer at http://localhost:5173
  luminon stop renderer  # stop only renderer
  luminon stop mcp       # explain how to stop a host-managed MCP
  luminon status         # show running processes and data dir
  luminon help           # show this message`);
}

function parseMcpMode(args: string[]): McpMode | undefined {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--mode") {
      const value = args[i + 1]?.trim().toLowerCase();
      if (value === "full" || value === "lite" || value === "ultra-lite") {
        return value;
      }
      console.error("Invalid MCP mode. Use: full, lite, or ultra-lite.");
      process.exit(1);
    }
    if (arg.startsWith("--mode=")) {
      const value = arg.slice("--mode=".length).trim().toLowerCase();
      if (value === "full" || value === "lite" || value === "ultra-lite") {
        return value;
      }
      console.error("Invalid MCP mode. Use: full, lite, or ultra-lite.");
      process.exit(1);
    }
  }
  return undefined;
}

function start(target: StartTarget): void {
  if (target === "mcp") {
    console.error("MCP uses stdio and must be started with 'luminon mcp' from an AI Tool, not with 'start mcp'.");
    process.exit(1);
  }
  if (target === "stack") {
    console.error("Use 'luminon mcp' in the AI Tool and 'luminon start renderer' separately. 'start stack' is not reliable for stdio MCP.");
    process.exit(1);
  }
  if (target === "renderer") {
    startManagedProcess("renderer");
  }
}

function stop(target: StopTarget): void {
  if (target === "stack") {
    stopManagedProcess("renderer");
    console.log("A host-managed MCP stops when the AI Tool session closes.");
    return;
  }
  if (target === "renderer") {
    stopManagedProcess("renderer");
  }
  if (target === "mcp") {
    console.log("A host-managed MCP stops when the AI Tool session closes.");
  }
}

function attachMcpLock(child: ChildProcess): void {
  updateManagedProcess("mcp", {
    pid: child.pid,
    startedAt: new Date().toISOString(),
    mode: "stdio"
  });

  const cleanup = () => {
    const current = loadLock().mcp;
    if (current?.pid === child.pid) {
      updateManagedProcess("mcp", undefined);
    }
  };

  child.on("exit", cleanup);
  child.on("error", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

function runMcpStdio(modeOverride?: McpMode): void {
  ensureBaseDir();
  const existing = loadLock().mcp;
  if (existing?.pid && pidAlive(existing.pid)) {
    console.error("MCP is already running. Use 'luminon status' or 'luminon stop mcp'.");
    process.exit(1);
  }

  const { command, args } = commandFor("mcp");
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      MCP_DATA_DIR: dataDir,
      ...(modeOverride ? { LUMINON_MCP_MODE: modeOverride } : {})
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  attachMcpLock(child);

  process.stdin.pipe(child.stdin!);
  child.stdout!.pipe(process.stdout);
  child.stderr!.pipe(process.stderr);

  process.stdin.on("close", () => {
    child.stdin?.end();
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

const [cmd, arg, ...rest] = process.argv.slice(2);

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  usage();
  process.exit(0);
}

if (cmd === "mcp") {
  const modeOverride = parseMcpMode([arg, ...rest].filter((value): value is string => Boolean(value)));
  runMcpStdio(modeOverride);
} else if (cmd === "start") {
  const target = (arg as StartTarget | undefined) ?? "stack";
  if (!["stack", "mcp", "renderer"].includes(target)) {
    usage();
    process.exit(1);
  }
  start(target);
} else if (cmd === "stop") {
  const target = (arg as StopTarget | undefined) ?? "stack";
  if (!["stack", "mcp", "renderer"].includes(target)) {
    usage();
    process.exit(1);
  }
  stop(target);
} else if (cmd === "status") {
  printStatus();
} else {
  usage();
  process.exit(1);
}
