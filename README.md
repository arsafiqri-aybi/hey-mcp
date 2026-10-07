# Hey by Ars — Gateway & MCP

New private project, separate from previous operator systems. The implementation provides private OAuth, one-time pairing, device authentication, durable tasks, idempotent action receipts, observation/media storage and nine MCP tools. Run `npm test` and `npm run check` with Node 22+.

The Android companion is https://github.com/arsafiqri-aybi/hey-android. The gateway target is `https://hey-gateway.arsafiqri-ua03.workers.dev/mcp`. Deployment and device completion are distinct. See `architecture/CONTRACT.json`, `evaluation/STATUS.md`, and the device test plan before treating any product capability as verified.

Deploy the three source modules with wrangler.jsonc. Required secret bindings are STATE_KEY (base64 256-bit AES key), CONTROL_HASH (optional bootstrap control digest), SETUP_HASH and SETUP_EXPIRES (single-use owner setup). Optional Firebase bindings are FIREBASE_PUBLIC (public Android options) and FCM_SERVICE_ACCOUNT (private server service account). Secret values never belong in this repository.

The owner opens the one-time setup link and sets their private password. Connect the plugin via OAuth. Call hey_pair and open the supplied link on the phone with Hey installed. Once paired, use explicit device IDs and stable action IDs. Read task and evidence results; queued commands are not successful browser operations.

Push provisioning, physical Vivo tests, audio session behavior, target-site browser compatibility and real ChatGPT audio ingestion remain separate acceptance gates. The target scope is preserved; this release does not claim the entire product is complete.
