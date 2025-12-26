# raven

Minimal setup to run the server and CLI locally.

## What it is

- A lightweight memory server that stores thoughts in SQLite (with FTS5), uses Gemini to tag and answer, and exposes a tiny HTTP API plus a Bun CLI.

## How it works

```
Client (HTTP / CLI)
	|
	| 1) Sends x-server-secret
	v
Elysia server
	|
	| /remember: text -> Gemini tags -> store in SQLite (memories + FTS index)
	| /remind:  question -> Gemini keywords -> FTS search -> Gemini answer from context
	| /delete:  question -> FTS search -> Gemini picks IDs -> delete rows
	v
SQLite (memories + memories_idx FTS)
```

## Prereqs

- [Bun](https://bun.com) v1.3+ installed and on PATH

## Install

```bash
bun install
```

## Configure env

Set required variables (no defaults):

```bash
export GEMINI_API_KEY="<your_gemini_key>"
export SERVER_SECRET="<any_shared_secret>"
export DB_PATH="./data/memories.db"
export MODEL_ID="gemini-2.5-flash"
```

## Run the server

```bash
bun run src/index.ts
```

The server listens on port 3000 and expects header `x-server-secret: $SERVER_SECRET`.

## CLI (rv)

Set API URL and secret for the CLI:

```bash
export RAVEN_API_URL="http://localhost:3000"
export RAVEN_SECRET_KEY="$SERVER_SECRET"
```

Use directly with Bun:

```bash
bun run rv r "Buy milk tomorrow"
bun run rv q "What did I say about milk?"
bun run rv d "Delete the milk note"
```

Build a standalone binary:

```bash
bun run build:cli
```

Add it to your PATH:

```bash
mv ./rv ~/.local/bin/rv   # or any PATH dir
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

rv r "Hello"
```
