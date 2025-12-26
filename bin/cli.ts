#!/usr/bin/env bun

import { spawn } from "bun";
import { unlinkSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const API_URL = process.env.RAVEN_API_URL;
const API_KEY = process.env.RAVEN_SECRET_KEY;

if (!API_URL) {
  console.error("\x1b[31mError: RAVEN_API_URL is not set.\x1b[0m");
  process.exit(1);
}

if (!API_KEY) {
  console.error("\x1b[31mError: RAVEN_SECRET_KEY is not set.\x1b[0m");
  process.exit(1);
}

const COLORS = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

const [, , command, ...args] = process.argv;
const input = args.join(" ").trim();

function usage(): never {
  console.log(`
Usage:
  rv r|remember|save [text]
  rv q|ask|remind <question>
  rv d|delete <query>
`);
  process.exit(1);
}

async function post(path: string, payload: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-server-secret": API_KEY!,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(`${COLORS.red}HTTP ${res.status}${COLORS.reset}`);
    console.error(text);
    process.exit(1);
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(`${COLORS.red}Invalid JSON response${COLORS.reset}`);
    console.error(text);
    process.exit(1);
  }
}

async function openEditor(): Promise<string> {
  const editor = process.env.EDITOR || "vim";
  const tmpFile = join(tmpdir(), `raven-${Date.now()}.txt`);
  writeFileSync(tmpFile, "");

  const proc = spawn([editor, tmpFile], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  await proc.exited;

  const content = readFileSync(tmpFile, "utf-8").trim();
  try {
    unlinkSync(tmpFile);
  } catch {}
  return content;
}

switch (command) {
  case "r":
  case "remember":
  case "save": {
    let content = input;
    if (!content) {
      content = await openEditor();
      if (!content) {
        console.error(`${COLORS.red}Aborted.${COLORS.reset}`);
        process.exit(1);
      }
    }

    console.log(`${COLORS.blue}🧠 Saving...${COLORS.reset}`);

    const res = await post("/remember", { text: content });

    if (res.ok) {
      console.log(`${COLORS.green}✔ Saved!${COLORS.reset}`);
      if (Array.isArray(res.tags) && res.tags.length > 0) {
        console.log(
          `${COLORS.yellow}Tags:${COLORS.reset} ${res.tags.join(", ")}`
        );
      }
    } else {
      console.error(`${COLORS.red}Error:${COLORS.reset}`, res);
      process.exit(1);
    }
    break;
  }

  case "q":
  case "ask":
  case "remind": {
    if (!input) usage();

    console.log(`${COLORS.blue}🔍 Thinking...${COLORS.reset}`);

    const res = await post("/remind", { question: input });

    console.log(
      `\n${COLORS.green}${res.answer ?? "No answer"}${COLORS.reset}\n`
    );

    if (res.stats) {
      console.log(
        `${COLORS.blue}--------------------------------${COLORS.reset}`
      );
      console.log(
        `${COLORS.yellow}📊 Stats:${COLORS.reset} ${
          res.stats.found ?? 0
        } records`
      );
      if (res.stats.keywords) {
        console.log(
          `${COLORS.yellow}Keywords:${COLORS.reset} ${res.stats.keywords.join(
            ", "
          )}`
        );
      }
      console.log();
    }
    break;
  }

  case "d":
  case "delete": {
    if (!input) usage();

    const res = await post("/delete", { question: input });

    console.log(`\n${COLORS.green}${res.answer ?? "Done"}${COLORS.reset}\n`);
    break;
  }

  default:
    usage();
}
