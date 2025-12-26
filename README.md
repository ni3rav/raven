# raven

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## CLI (rv)

Set your API URL and secret:

```bash
export RAVEN_API_URL="http://localhost:3000"
export RAVEN_SECRET_KEY="<your_server_secret>"
```

Run the CLI directly:

```bash
bun run rv r "Buy milk tomorrow"
bun run rv q "What did I say about milk?"
bun run rv d "Delete the milk note"
```

Or compile as a standalone binary:

```bash
bun run build:cli
./rv r "Test note"
```
