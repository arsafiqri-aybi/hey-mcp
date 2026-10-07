# Protocol 1

Device enrollment: POST `/api/enroll` with a single-use code from `hey_pair`. The response supplies deviceId and an opaque deviceToken. Keep tokens in Android Keystore-backed storage. The client uses authenticated POST `/api/device/poll`; payload includes a persisted owner intent, session UUID, health, activeTaskId and progress. Server assigns connection generation. Browser commands carry taskId, actionId, digest, generation, deadlineAt, method and payload.

Evidence: POST `/api/device/evidence` with task binding, sequence and observation. Sequences are contiguous and repeated identical evidence is accepted. Each observation includes observedAt, stateVersion, page state, media state and optional JPEG/WAV content. Media metadata is outside the MCP media block. Body limit is 900,000 bytes. Evidence is encrypted and chunked below the storage value limit.

Result: POST `/api/device/result` with binding, terminal status, verified flag, result and reason. A retry of an identical result receipt is accepted; a conflicting result is rejected. Lost lease or changed generation makes execution UNKNOWN. The task-read tool pages one observation at a time and returns genuine MCP image/audio blocks. Keep the returned cursor for subsequent pages.

MCP uses stateless Streamable HTTP JSON responses at `/mcp`. Discovery does not launch the browser. POST initialize, tools/list, tools/call and notifications/initialized are supported. OAuth has HTTPS dynamic client registration, resource-bound S256 PKCE, owner login, expiring opaque access tokens, rotating refresh tokens and revocation. Origin checks apply to browser-origin requests. No secret is encoded in the MCP path.
