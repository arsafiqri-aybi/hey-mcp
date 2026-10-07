# Hey by Ars — Project Concept Summary

## 1. Awal: Identifikasi Repo Lama

Project ini berangkat dari evaluasi beberapa repo lama yang masih berada dalam satu keluarga konsep browser operator, terutama:

- `personal-browser-operator`
- `phone-browser-bridge`

Sementara `cloud-browser-mcp` masih satu keluarga fungsi, tetapi memakai pendekatan browser yang berjalan di cloud.

Dari situ diputuskan untuk tidak sekadar melanjutkan struktur lama, tetapi merancang ulang project dari nol dengan visi yang lebih jelas, lebih sederhana digunakan, dan lebih konsisten secara arsitektur.

---

# 2. North Star Project

Tujuan utama project adalah membuat ChatGPT memiliki **browser pribadi yang benar-benar bisa digunakan sebagai “surface” miliknya sendiri di HP pengguna**.

Bukan sekadar:

> URL → ambil transcript → summarize

Tetapi benar-benar:

> ChatGPT menerima perintah → browser berjalan → ChatGPT mengamati apa yang tampil → mendengar audio → melakukan interaksi → memahami hasil → memverifikasi → menjawab berdasarkan apa yang benar-benar terjadi.

Contoh:

> “Tonton video ini sampai selesai.”

Sistem harus benar-benar memutar video tersebut dari awal sampai akhir, mengikuti visual, audio, teks, perubahan scene, dan konteksnya.

---

# 3. Browser Harus Independen dari Aktivitas HP Pengguna

Requirement penting:

**Browser milik agent harus dapat tetap bekerja di background sementara pengguna menggunakan HP untuk hal lain.**

Pengguna tetap bisa:

- memakai ChatGPT,
- WhatsApp,
- Instagram,
- membuka aplikasi lain,
- atau melakukan aktivitas normal lain di HP,

sementara browser agent terus menjalankan task.

Artinya pengguna dan ChatGPT **tidak berebut satu layar browser yang sama**.

Karena itu, arah yang dipilih adalah:

**bukan mengontrol Google Chrome utama Android dari luar, tetapi membangun dedicated Chromium/browser runtime milik aplikasi sendiri.**

---

# 4. Target Akses: Human-Equivalent Browser Access

ChatGPT diharapkan memiliki akses seluas mungkin seperti manusia yang sedang menggunakan browser.

Secara konsep, sistem memiliki:

- mata,
- telinga,
- tangan,
- memory,
- state awareness,
- verification.

## Mata

Kemampuan untuk:

- melihat viewport,
- membaca UI,
- melihat gambar,
- melihat canvas,
- melihat video frames,
- memahami popup,
- memahami perubahan halaman,
- membaca chart,
- melihat elemen visual lain yang tidak selalu tersedia melalui DOM.

## Telinga

Kemampuan untuk:

- menangkap audio browser,
- memahami audio video,
- speech-to-text,
- sinkronisasi audio dengan visual,
- mengetahui perubahan audio dan media state.

## Tangan

Kemampuan untuk:

- click,
- type,
- scroll,
- drag,
- upload,
- download,
- navigate,
- mengelola tab,
- mengisi form,
- mengendalikan media,
- menjalankan browser interaction secara umum.

## Memory

Kemampuan untuk mengingat:

- task state,
- tab aktif,
- browser session,
- timestamp video,
- progress,
- checkpoint,
- hasil observasi,
- recovery state.

## Verification

Sistem tidak boleh menganggap:

> “sudah click = berhasil.”

Tetapi harus memakai pola:

> click → observe lagi → cek hasil sebenarnya.

---

# 5. Video Harus Benar-Benar “Ditonton”

Ini adalah salah satu requirement utama.

Jika pengguna meminta:

> “Tonton video ini.”

ChatGPT tidak boleh hanya mencari:

- transcript,
- summary,
- metadata,
- artikel pihak lain.

Sistem harus memperoleh pengalaman audiovisual langsung dari browser runtime.

Secara konsep:

```text
video playback
→ visual frames
→ audio
→ subtitle jika ada
→ scene changes
→ timestamp
→ media state
→ combined understanding
```

Target akhirnya adalah ChatGPT bisa menjelaskan sesuatu seperti:

> “Pada menit 06:14 videonya menunjukkan X, sementara pembicara menjelaskan Y.”

Sistem juga harus mampu membedakan:

- sesuatu yang benar-benar diamati,
- sesuatu yang hanya diinferensikan.

---

# 6. Instruksi Pengguna Adalah Sumber Otoritas Utama

Prinsip:

## User Instruction Is Authority

Jika pengguna secara eksplisit mengatakan:

> “Login menggunakan username X dan password Y.”

Sistem langsung melakukan login.

Jika pengguna mengatakan:

> “Hapus X.”

Sistem melakukan penghapusan sesuai scope yang diminta.

Tidak perlu meminta confirmation berulang untuk sesuatu yang sebenarnya sudah diperintahkan secara eksplisit.

Namun sistem tidak boleh memperluas arti perintah secara sembarangan.

Contoh:

> “Bersihkan inbox.”

Tidak otomatis berarti:

> “Hapus seluruh email secara permanen.”

Sedangkan:

> “Hapus semua email di folder X secara permanen.”

Sudah sangat eksplisit.

Prinsipnya:

**execute explicit intent, constrain ambiguous intent.**

---

# 7. Credential Handling

Username/password boleh diberikan langsung melalui chat untuk task tertentu.

Sistem kemudian menggunakannya untuk browser action yang diminta.

Namun arsitektur harus memastikan credential tidak sembarangan masuk ke:

- screenshot,
- activity logs,
- browser observation output,
- telemetry,
- debug log.

Credential dapat digunakan, tetapi diperlakukan secara sensitif dan sebaiknya ephemeral bila memungkinkan.

---

# 8. Bentuk Produk

Bentuk sistem yang dipilih:

```text
ChatGPT
   ↓
Plugin / MCP
   ↓
Gateway
   ↓
Secure connection
   ↓
Android App
   ↓
Dedicated Browser Runtime
   ↓
Website
```

Ini bukan hanya MCP.

MCP hanyalah pintu ChatGPT menuju sistem.

Produk sesungguhnya terdiri dari:

**Android App + Browser Runtime + Gateway + MCP/Plugin.**

---

# 9. Android App Adalah Komponen Utama di HP

Diperlukan satu APK Android khusus.

Di dalam APK nantinya terdapat:

- dedicated Chromium runtime,
- persistent browser profile,
- browser controller,
- visual observer,
- audio/media observer,
- task executor,
- verification engine,
- persistent local state,
- connection service,
- secure device identity,
- live browser UI,
- takeover UI,
- background execution service.

Aplikasi bukan sekadar remote control.

Aplikasi ini adalah **tubuh/browser host milik ChatGPT di HP pengguna**.

---

# 10. Bukan Google Chrome Utama

Menggunakan Google Chrome utama akan menimbulkan konflik karena UI aktif bisa berubah ketika pengguna membuka aplikasi lain.

Karena itu dipilih:

## Dedicated Browser Milik Aplikasi

Browser tetap berbasis Chromium, tetapi runtime-nya dimiliki dan dikontrol oleh aplikasi.

Keuntungannya:

- background lebih independen,
- agent tidak berebut layar dengan pengguna,
- DOM/state internal lebih mudah diakses,
- media state lebih mudah diamati,
- profile dapat dibuat persistent,
- observasi lebih reliable,
- tidak harus mengandalkan Accessibility untuk semuanya.

---

# 11. Pengalaman Penggunaan Akhir

Target penggunaan:

> “@Hey buka YouTube dan tonton video ini.”

Kemudian:

```text
ChatGPT
↓
Hey Plugin
↓
Gateway
↓
HP dibangunkan
↓
Hey Android Runtime
↓
Browser berjalan
↓
Video diputar
↓
Visual + audio diamati
↓
Task diverifikasi
↓
Hasil kembali ke ChatGPT
```

Pengguna tidak perlu:

- membuka browser agent manual setiap kali,
- menjalankan Termux,
- copy token,
- menentukan IP,
- menjalankan command,
- membuka port,
- setup ADB setiap kali.

---

# 12. Background Wake Architecture

Target utama:

## ChatGPT Command = Wake Signal

Aplikasi tidak perlu mempertahankan browser hidup 24/7.

Lebih baik memakai pola:

```text
IDLE
↓
ChatGPT command
↓
push wake
↓
APK bangun
↓
secure connection
↓
ambil task
↓
foreground/background runtime bekerja
↓
task selesai
↓
hasil dikirim
↓
kembali idle
```

Untuk task panjang seperti menonton video satu jam, runtime dapat menggunakan foreground service agar Android tidak mudah menghentikannya.

---

# 13. Android Host Requirements

Agar HP dapat menjadi execution host, Android app perlu kemampuan seperti:

- push receiver untuk wake-up,
- Foreground Service,
- background media capability,
- persistent notification ketika task berjalan,
- battery/background allowance,
- Vivo Autostart / background power permission,
- boot recovery,
- device identity,
- persistent local storage,
- secure outbound connection,
- wake management saat benar-benar diperlukan.

Karena browsernya milik APK sendiri, sistem dasar tidak perlu bergantung pada:

- ADB,
- Termux,
- screen recording seluruh HP,
- Accessibility sebagai transport utama.

---

# 14. Pelajaran dari Project Sebelumnya

Project sebelumnya terasa sangat ribet karena melibatkan:

- Termux,
- ID,
- port,
- pairing,
- ADB,
- Wireless Debugging,
- popup,
- split-screen settings,
- state popup dan app yang tidak sinkron.

Masalah utama yang pernah terjadi:

```text
Popup:
Connected ✅

App:
Disconnected ❌

Runtime:
No connection ❌
```

Dari pengalaman ini, beberapa design rule utama ditetapkan.

---

# 15. Tidak Ada Termux / Port / ADB untuk Penggunaan Normal

Target baru:

- **0 Termux**
- **0 port manual**
- **0 local IP manual**
- **0 `adb connect`**
- **0 Wireless Debugging pairing**
- **0 split-screen requirement**
- **0 technical setup setiap penggunaan**

Termux tidak menjadi runtime production.

ADB tidak menjadi transport utama.

Connection dari HP sebaiknya selalu **outbound ke gateway**, bukan membuka port publik ke HP.

---

# 16. Pairing Dibuat Seperti Aplikasi Consumer

Tetap perlu pairing sekali saat pertama install supaya gateway tahu:

> “Ini perangkat milik user ini.”

Namun pairing bukan ADB pairing.

Alur ideal:

```text
Install Hey
↓
Open
↓
Connect
↓
Device identity dibuat
↓
One-time registration
↓
Gateway verifies device
↓
PAIRED
↓
selesai
```

Pairing dapat menggunakan:

- one-time code,
- deep link,
- QR,
- atau mekanisme registration lain.

Setelah itu pairing tersimpan.

Reboot tidak boleh meminta pairing ulang.

---

# 17. Tidak Perlu Popup Terpisah

Setup dan pairing sebaiknya dilakukan langsung di dalam aplikasi.

Jika perlu membuka Android Settings untuk suatu permission, app membuka halaman settings tersebut.

Ketika pengguna kembali:

**app membaca ulang state asli dari Android.**

Tidak ada popup terpisah yang menyimpan connection state sendiri.

---

# 18. Single Source of Truth

Main UI, onboarding, notification, browser runtime, dan background service harus membaca connection state yang sama.

Contoh state machine:

```text
UNREGISTERED
↓
REGISTERING
↓
PAIRED
↓
ONLINE
↓
TASK_RUNNING
```

Tidak boleh terjadi lagi:

```text
Popup: ONLINE
App: OFFLINE
Runtime: UNKNOWN
```

Status `ONLINE` hanya muncul ketika koneksi benar-benar terverifikasi.

---

# 19. UI Tidak Melakukan Koneksi Sendiri

UI hanya menjadi controller/presenter.

Yang benar-benar menangani:

- device registration,
- credentials,
- socket/session,
- reconnect,
- verification,
- state persistence,

adalah **Connection Service**.

Artinya jika layar setup ditutup, connection process tidak hilang.

---

# 20. UX / Product Philosophy

Aplikasi harus dibuat benar-benar premium.

Bukan minimal yang kosong, tetapi:

## Simple, Premium, Elegant, Soft-Tech

Inspirasi rasa desain:

- Apple,
- iOS,
- macOS,
- Dynamic Island,
- GitHub,
- ChatGPT.

Namun bukan meniru visual mentah-mentah.

---

# 21. Visual Language

## Background

Target:

- tidak polos mati,
- off-white / charcoal / graphite,
- subtle tint,
- soft gradient bila cocok.

## Cards / Panels

Target:

- clean,
- rounded,
- mempunyai depth,
- soft shadow,
- refined border.

## Border

Target:

- tetap terlihat jelas,
- tidak keras,
- bisa sedikit translucent,
- bisa memiliki inner highlight.

## Shadow

Target:

- lembut,
- tidak terlalu hitam,
- natural,
- memberikan separation antar-layer.

## Blur

Target:

- selective,
- digunakan untuk floating surface,
- overlay,
- top controls,
- sheet,
- bukan glassmorphism berlebihan.

---

# 22. Simple Bukan Berarti Polos

Bukan:

> background putih + kotak putih + satu garis.

Tetapi:

> background putih/off-white + card putih + subtle border + shadow + blur/depth + spacing.

Hasil yang diinginkan:

**simple, premium, refined, alive.**

---

# 23. Motion Direction

Motion adalah bagian penting desain.

Target motion:

- smooth,
- natural easing,
- soft scale,
- fade + movement,
- polished expand/collapse,
- fluid sheets,
- refined loading,
- animated state transitions.

Filosofi:

## Alive, Not Flashy

Animasi tidak hanya dekorasi, tetapi memberi feedback dan rasa kualitas.

---

# 24. Design Principles

Prinsip desain yang sudah terbentuk:

## Simple, Not Empty

Sederhana tetapi tidak terasa kosong.

## Depth Without Noise

Ada layers, shadows, blur, tetapi tetap tenang.

## Soft Clarity

Komponen jelas tetapi tidak kasar.

## Motion With Intention

Animasi memiliki fungsi.

## Premium Control Surface

Aplikasi terasa seperti personal computing tool premium, bukan dashboard teknis.

---

# 25. Struktur UI Awal

Gambaran bagian utama aplikasi:

```text
Home
Connection
Live Browser
Tasks
Activity / History
Settings
```

Setup/onboarding dilakukan di dalam app, bukan popup terpisah.

Live Browser memungkinkan pengguna melihat apa yang agent sedang kerjakan dan mengambil alih secara manual bila perlu.

---

# 26. Nama Project

Beberapa nama sempat dibahas:

- Personal Browser
- Vela
- Arc-like naming
- Aven
- Aev
- dan lainnya.

Akhirnya dipilih nama yang sangat simpel dan personal:

# Hey

Dengan branding:

## Hey by Ars

Nama **Ars** digunakan sebagai creator/owner identity di repo.

---

# 27. Struktur Naming

Working naming saat ini:

```text
Product
Hey

Brand
Hey by Ars

Android App
Hey

ChatGPT Plugin
Hey

Android repository
hey-android

MCP/backend repository
hey-mcp

Browser runtime
Hey Runtime

Gateway
Hey Gateway
```

Contoh penggunaan:

> “@Hey tonton video ini sampai selesai.”

atau:

> “@Hey login ke website ini menggunakan akun yang aku kasih.”

---

# 28. Bentuk Final Produk dari Sudut Pandang Pengguna

Walaupun sistem internal kompleks, pengguna hanya perlu melihat:

```text
┌─────────────────┐
│      ChatGPT    │
│      @Hey       │
└────────┬────────┘
         │
         │ Internet
         ▼
┌─────────────────┐
│   Hey Gateway   │
│   + Hey MCP     │
└────────┬────────┘
         │
         ▼
┌───────────────────────────┐
│          HP kamu          │
│                           │
│          Hey App          │
│             │             │
│       Hey Runtime         │
│             │             │
│   Dedicated Chromium      │
│                           │
│  👁 Visual                │
│  👂 Audio                 │
│  ✋ Browser control       │
│  🧠 State / memory        │
│  ✓ Verification           │
└───────────────────────────┘
```

Pengguna tetap bebas memakai HP.

Hey bekerja pada browser runtime-nya sendiri.

---

# 29. Ringkasan Utama

Jika seluruh konsep dipadatkan menjadi satu kalimat:

> **Hey by Ars adalah personal browser runtime di Android yang dapat dibangunkan dan dikendalikan langsung dari ChatGPT, mempunyai browser Chromium persisten sendiri, mampu melihat, mendengar, memahami, berinteraksi, dan memverifikasi aktivitas web secara nyata di background, sementara pemilik HP tetap bebas menggunakan perangkatnya untuk aktivitas lain.**

Target UX akhirnya:

> **install sekali → pair sekali → permission sekali → setelah itu cukup panggil `@Hey` dari ChatGPT.**

---

# 30. Hal yang Belum Dikunci

Beberapa bagian yang masih perlu dirancang lebih lanjut:

- internal browser runtime architecture,
- protocol ChatGPT ↔ Gateway ↔ Android,
- audiovisual observation pipeline,
- media/video understanding,
- permission matrix,
- device registration,
- wake strategy,
- persistent state architecture,
- credential security,
- browser profile persistence,
- live takeover,
- task recovery,
- exact UI/UX screens,
- design system,
- motion system,
- verification architecture,
- repository architecture,
- deployment model.

Dokumen ini menjadi **concept baseline** untuk seluruh pengembangan Hey by Ars berikutnya.
