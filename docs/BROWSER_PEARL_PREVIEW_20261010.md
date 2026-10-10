# Browser adapter and immutable validation

The Android Pearl preview extends the existing Playwright-inspired Android WebView adapter with bounded open-shadow semantic lookup, explicit scan/ambiguity errors, action readiness, nested scrolling, targeted postcondition verification and bounded command completion. It does not embed the Node Playwright runtime; closed shadow roots and cross-origin frame contents remain outside this observation scope.

MCP validation now normalizes a structured clone of each payload. It rejects invalid explicit payload values instead of silently converting them to an empty object. Caller objects remain unchanged, so normalization cannot alter a later retry digest. Existing immutable receipts, action IDs, process generation checks and UNKNOWN/no-replay behavior are preserved. No additional tool or deployed protocol requirement is introduced.

Local validation on 2026-10-10: `npm test` passed 31 tests and `npm run check` passed. Tests include normalization without caller mutation and invalid null/false/zero/string/array payloads, in addition to receipt, process replacement, OAuth, media-evidence and locator contract checks. These results certify source behavior in the test harness only. The Worker has not been deployed; actual Android/browser, wake and audio gates remain separate.

Changes are stored on `feat/hey-home-pearl-4k-browser-20261010`; the deployed main branch is preserved.
