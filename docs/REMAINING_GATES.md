# Remaining product gates

This is a working source/build/gateway baseline, not the complete product certification. The original concept and CONTRACT.json remain authoritative.

1. Prove the private display continues rendering on the real Vivo while ChatGPT/WhatsApp, screen lock, app UI destruction and OEM power management are exercised. Replan the runtime if it stops.
2. Provision a new Firebase project/app for id.ars.hey. FIREBASE_PUBLIC needs applicationId, apiKey, senderId and projectId; FCM_SERVICE_ACCOUNT is a separate private server credential. Restrict the API key to that Android application/signature and grant only messaging permission to the server account. Prove high-priority push and explicit recovery after priority downgrade or force-stop. Current foreground polling is implemented; energy-efficient idle lifecycle is not certified.
3. Prove MediaProjection/audio session behavior across supported Android versions, actual WebView playback capture, silence versus blocked capture, DRM, upload gaps and transcript/visual understanding in the real ChatGPT host. Video frame sampling is approximately once per accepted upload plus one second. It is not certified as full human-equivalent visual understanding.
4. Decide the browser embedding strategy for required sites. Google OAuth forbids embedded user agents. WebView popup, passkey and media compatibility, download completion, manual keyboard/clipboard interaction and site permission handling require further work; the existing candidate cannot claim all Chrome capabilities.
5. Finish real client OAuth connection and end-to-end pairing from the installed plugin. Gateway protocol tests are synthetic. They do not verify the actual ChatGPT connection or phone deep-link behavior.
6. Establish owner-controlled release signing, upgrade/migration and recovery. The supplied APK is debug-signed for testing. Validate accessibility of browser takeover, large text, motion, account removal and credential cleanup. Bitmap takeover does not expose a full webpage accessibility tree.

Gate failures are explicit blockers or replan triggers, never silent reductions in the original target. Keep UNKNOWN actions unreplayed. Source fixes, live service checks, emulator checks and physical-device evidence must remain distinguishable.
