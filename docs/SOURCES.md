# Sources checked 2026-10-07

- Android WebView FAQ: https://chromium.googlesource.com/chromium/src/+/HEAD/android_webview/docs/faq.md — Chromium foundation and independent Chrome data.
- Virtual display API: https://developer.android.com/reference/android/hardware/display/DisplayManager — private presentation/own content behavior; not proof of this app's background rendering.
- Audio capture: https://developer.android.com/media/platform/av-capture — MediaProjection consent, record-audio permission, capture UID and policy restrictions.
- Android foreground services: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start — Android 12+ restrictions and high-priority FCM exemption.
- Foreground service types: https://developer.android.com/develop/background-work/services/fgs/service-types — specialUse declaration and mediaProjection requirements.
- Firebase client: https://firebase.google.com/docs/cloud-messaging/android/get-started — client/service integration and Play Services requirement.
- Firebase priority: https://firebase.google.com/docs/cloud-messaging/android-message-priority — downgrade and user-visible task behavior.
- Google embedded OAuth restrictions: https://developers.google.com/identity/protocols/oauth2/policies — no universal login-parity claim for WebView.
- Cloudflare Durable Object lifecycle: https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/ — durable storage vs instance memory.

Prior owner repositories supplied engineering guidance and failure patterns. Their deployment identities and credentials are not part of Hey. The exact original concept remains preserved in docs/CONCEPT.md.
