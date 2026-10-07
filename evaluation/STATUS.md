# Repair status — 0.2.0

Source repairs implemented. Gateway regression tests: 28 PASS; Android verifier tests: 7 PASS; debug and unsigned release APK builds: PASS; lint: 0 errors, 4 warnings. See repair-0.2.0.json. Physical Vivo visual/media/audio/lifecycle retests remain required. Firebase/FCM configuration remains unavailable. Original 0.1.0 signing key was not recovered, so an in-place update is blocked; installed data was not removed. Gateway public and authenticated plugin checks verified version 0.2.0; existing device pairing/state remains. See hey-mcp/evaluation/deployment-0.2.0.json. Prior evaluation below is historical evidence.

# Release truth — 0.1.0

Product status: BUILD_IN_PROGRESS. Gateway deterministic tests: PASS (19 cases). JavaScript syntax: PASS. Gateway deployment: PASS; new Worker hey-gateway, modules, SQLite Durable Object and workers.dev route are active. Live HTTP / Durable Object protocol tests: PASS (16 checks); see live-gateway.json. New private Hey plugin was created and its stored MCP URL was read back successfully. Both private source repositories were created independently of older systems.

The deterministic tests use a storage harness. The live tests use a clearly labelled synthetic protocol client that was revoked afterward. Neither result proves Android browser rendering, physical background behavior, captured audio, dormant push wake or ChatGPT audio ingestion. Test data is synthetic, not a real screenshot or recorded sound.

Open gates are tracked in architecture/CONTRACT.json and docs/DEVICE_TEST_PLAN.md. Firebase project/service-account configuration is not available in the current authorized connectors; dormant wake remains blocked at provisioning. A Firebase adapter is implemented but not configured or physically proven. Google OAuth prohibits embedded user agents, so the selected WebView runtime cannot be certified as universal Chrome parity. The complete target is preserved for runtime replanning.

No product-complete, universal browser access, 24/7 or fully understood video claim is made. Owner password setup and real plugin OAuth connection still require the owner's interaction.

Android initial debug APK compilation/signature/ZIP alignment: PASS. Android lint: PASS with 0 errors and 5 recorded warnings. Local emulator UI startup: BLOCKED_HOST_RUNTIME; emulator process exited. No real-phone gate changed. The debug artifact is for testing; production signing remains open.

Owner-form fix: same-origin Referrer-Policy preserves browser form Origin metadata; cross-origin and null-origin POSTs remain rejected. Regression test verifies owner setup, one-use setup and strict origin rejection. Physical browser form retry remains owner-operated.

OAuth callback fix: the login page form-action policy now includes only the validated registered client callback origin, alongside self. Owner setup remains self-only. PKCE, resource binding, registered redirect matching, login CSRF and origin rejection remain enforced. Gateway regression tests pass; real owner plugin retry is still pending.

