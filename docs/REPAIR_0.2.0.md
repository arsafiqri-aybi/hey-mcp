# Hey 0.2.0 — P0 repair candidate

Authoritative starting points: hey-mcp 479084698d5a650c71c82d33b5d7ba30b85d1d6a and hey-android 6c15c111df65e5177b0064635fd86bd737185c84. The living stress log remains the defect history. This change addresses its findings without modifying older operator projects.

## Architecture decision

One WebView per tab remains the browser owner. When Browser is visible, its current WebView is moved into the Activity host using a MutableContextWrapper. When the Activity leaves, the same instance moves back to the app-owned Presentation. Activity references are released for inactive tabs too. A second mirrored browser and an Activity-only runtime were rejected because they lose session continuity or background operation.

Capture now requests fresh DOM drawing via postVisualStateCallback, copies only the fully visible browser rectangle from the app window via PixelCopy, and uses explicitly labelled DOCUMENT_CANVAS as a fallback. Capture is bounded; password/OTP/card masks are installed before capture and painted again in native bitmap coordinates. Canvas fallback does not certify video pixels. Real Vivo screenshot/media capture remains a physical-device gate.

## Repairs

- Device-side readiness/pause/seek/arm/zero-frame/play/advancement sequence replaces the separate MCP seek/play/watch race. A zero-time sample is acknowledged before play. Playback stalls and missing consent have explicit errors. YouTube uses a bounded native play-control tap when normal play fails, followed by actual clock verification; no universal YouTube success claim.
- Abort generations also guard queued media requests, readiness callbacks and native play taps, so delayed callbacks cannot continue an old cancelled operation.
- Audio stops yielding chunks after session end, labels genuine silence separately, clears closed buffers, and uses sample-count timestamps without overlapping drain wall clocks. Old projection callbacks cannot change a newer intentional replacement session's state.
- Verifiers compare scroll offsets, tab identities and committed navigation, per-WebView document epochs, private input equality, focus/navigation transitions, and advancing media clocks. Query-secret redaction stays enabled; URL comparison uses matching canonical redaction. Unobservable clicks/keys remain uncertain.
- Owner pause is persisted before teardown, stops agent work, journals a terminal OWNER_PAUSED receipt, and attempts bounded delivery. Pending pause/result is reconciled before explicit resume. Gateway pause blocks new intake, cancels waiting work, and never push-wakes an intentionally paused device. A delayed owner-pause cancellation may reconcile UNKNOWN; delayed success may not.
- Local encrypted SQLite receipts replace the 10,000-entry JSON journal. Server receipts remain durable without a lifetime cap. Indexed active tasks and bounded retention cleanup avoid scanning every historical task on normal dispatch. Retry and conflict semantics remain intact; no unsafe receipt garbage collection was added.
- Renewal is idempotent during a 120-second overlap, and replacement heartbeat/renewal revokes the predecessor. The new token is durably stored before the next authenticated call. A crash before persistence beyond the overlap still requires recovery; this is not an unlimited old-token window.
- Progress is reset per task and bound to task ID/generation. Terminal state clears local and gateway health. Offline health is marked stale and exposes UNKNOWN browser/audio, rather than historical READY/CAPTURING.
- Scroll direction, missing ref, viewport, missing tab, final-tab, history and media errors are distinct. Repeated running cancellation stays CANCEL_REQUESTED. Queued cancellation reports OWNER_CANCELLED.
- Hostname checks normalize terminal DNS dots. Browser DNS guards remain in place. Downloads now validate every redirect hop in a controlled HTTPS transfer, with same-origin cookie scoping and a bounded file size. This closes the DownloadManager redirect-policy gap; DNS rebinding/TOCTOU resistance is not claimed as a completed penetration test.
- App opening resumes a paired active device, but respects intentional pause. Settings changes Jeda Hey to Lanjutkan Hey. Pressed/ripple/motion/haptic feedback acknowledges taps while respecting reduced motion.
- Firebase public options refresh independently of pairing, and asynchronous token failures are visible. Push tokens distinguish TOKEN_READY from gateway REGISTERED. Wake still needs actual FIREBASE_PUBLIC and FCM_SERVICE_ACCOUNT, then physical dormant testing. Force Stop and reboot are separate platform/product states.

## Release gates

Automated source tests, build, deployment and physical device behavior are separate. Consult evaluation/repair-0.2.0.json for actual results. No new APK result constitutes Vivo UI, audio or wake certification.

The original 0.1.0 debug certificate SHA-256 is e77c945c03ae0126983aca0094a1dc98fea2c727e7dd986335460c6a455f015f. Its private signing key was not recovered after workspace maintenance. A fresh debug key cannot authorize an in-place Android update. Do not uninstall/reset the installed app as an automatic repair step. Signing recovery or an owner-approved migration is required; the unsigned release APK can be signed with the original key if recovered.

## Required physical retest

1. Confirm package/signing installation path without accidental data loss.
2. Navigate Example Domain: live Browser and masked screenshot must both show it. Compare active tab URL and session across Home/Browser/background/lock/unlock.
3. Take over during RUNNING work; no new agent input/evidence may continue. Hand back must permit new work without resurrecting the old task.
4. Verify scroll/history/tabs/fill/key actions, stale refs, last-tab protection and password/OTP/card screenshot masking.
5. Watch a controlled HTML5 source, then YouTube. Check zero-time evidence, actual advancement, media frames and audible signal; paused/stalled/cancelled/partial sessions must not claim completion.
6. End audio consent during a watch. Require explicit re-consent; no misleading WAV after closure.
7. Pause during RUNNING work, then resume with and without network. Require OWNER_PAUSED, durable result reconciliation, clean progress and no automatic execution of paused waiting work.
8. Configure Firebase/FCM and test dormant wake. Keep force-stop and reboot distinct.
9. Re-run prior security/ownership/idempotency/network-loss regression cases on the real device. Tests not executed remain RETEST_REQUIRED.
