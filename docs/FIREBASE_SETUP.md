# Firebase/FCM production activation

No Firebase project or private service-account credential is currently available to this project. Do not fabricate these values or copy credentials from older operator projects.

1. Create/select an owner-controlled Firebase project for Hey, and register Android application package id.ars.hey.
2. Obtain the registered Android application's google-services.json. Map public options:
   - applicationId = client[].client_info.mobilesdk_app_id (Firebase app ID, not the package name)
   - apiKey = client[].api_key[].current_key
   - senderId = project_info.project_number
   - projectId = project_info.project_id
3. Enable Firebase Cloud Messaging HTTP v1 and create a dedicated service account with only the required messaging-send permission. Keep the private JSON key out of source, APKs, chat messages and test logs.
4. Store its complete JSON in Cloudflare Worker hey-gateway secret FCM_SERVICE_ACCOUNT. Store the public options object as FIREBASE_PUBLIC on that same Worker. Both must describe the same Firebase project. No credential is required from an older bridge.
5. Hey 0.2.0 fetches public options at startup/reconnect and every five minutes; pairing is no longer the only configuration fetch. Restart the application after first activation if an immediate fetch is needed. Do not uninstall/reset merely to refresh Firebase.
6. Observe TOKEN_READY after Firebase issues a token and REGISTERED after the gateway accepts it. wakeConfigured only describes configuration availability; neither state proves wake delivery.
7. On the actual phone, leave owner intent ACTIVE, stop foreground interaction, then test ordinary dormant/process-dead recovery, heartbeat and a verified harmless task. Screen-lock success alone is insufficient. Android user Force Stop is a separate state and may require manual app launch; reboot auto-start is not part of the current contract.
8. Record actual push send, receipt, foreground-service start, heartbeat and task evidence separately in HEY_STRESS_TEST_LOG.md. High-priority FCM can be downgraded or foreground startup refused; USER_RESUME_REQUIRED must remain truthful.

Prerequisites to finish: authorized Firebase project access/public Android config and a safe way to install the dedicated service-account secret. Do not ask the owner to paste the private key into a chat.
