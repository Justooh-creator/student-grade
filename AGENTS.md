<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- School data syncs via school_students/schools tables (one JSON row per learner); learner edits go through a persistent per-teacher field-operation outbox (src/lib/syncMerge.ts + syncQueue.ts) and the caller-rights sync_student_changes RPC, which applies an op only while its base value still matches and records same-field clashes in student_sync_conflicts — never upsert whole learner rows, because that lets one teacher's offline save erase another's marks. merge_student_ops (SQL) and mergeStudentOps (TS) must stay identical.
- Private app screens live under the client-only _authenticated layout; the SSR public index renders the shared account form and sends authenticated users to the shared accountHome destination (School Details), preserving legacy / links and search parameters; keep payment checks separate from account access.
- A single root AccountProvider owns session transitions and cache invalidation; useUser consumes it so page mounts cannot create competing auth listeners.
- Spreadsheet reader libraries are dynamically loaded from the learner-upload action; imports are append-only and recheck class permissions, duplicates and capacity against current store data before one update.
- Broadsheets derive results and exact-stream ranking from the existing results module, use named landscape print pages, and reuse the existing PrintButton license gate so report-card grading and print rules remain unchanged.
- Privacy is a public content route; school records and broadsheets stay under the client-only authenticated layout.
- Keep both public manifest filenames identical after any metadata update for packaging-tool compatibility.
- Generate Q&A packs in browser-safe seeded modules with shared quiz/exam rules; keep one pack in page state for quiz, exam and scheme so answers and printing never regenerate independently. Original revision banks must not be presented as official WAEC papers or verified curriculum.
- Lesson-note drafts use teacher-scoped local storage; their separate A4 print page and dynamically loaded DOCX exporter must never change report-card print licensing or scoring.
- Bundle only verified curriculum references as official; teacher-provided scanned examples remain editable and explicitly attributed in their reference field.
- Attendance has its own early-years roster and class identifiers; reuse existing KG–Basic 9 school learners without expanding report-card class or scoring rules.
- Save attendance through an authenticated database RPC that validates membership, assignments and first-use trial atomically; never derive attendance licensing or permissions from browser storage.
- Daily fee totals are derived in the browser from saved attendance, payments and current rates (src/lib/fees.ts); learner profile rate_overrides inherit the general fee rate when absent and retain explicit zero; owner-only access and the trial gate are enforced by fee_admin_ok RLS.
- Fingerprint unlock is a device-local WebAuthn lock over the existing session (src/lib/biometric.ts + root FingerprintLock); it never replaces password sign-in or touches licensing.
- Explicit sign-out actions use signOutWithFingerprint before clearing session/caches; fallback verification is the operating system's PIN/password, never an app-stored PIN.
- Offline support uses vite-plugin-pwa generateSW with one guarded registrar (src/lib/registerSW.ts); never hand-write sw.js or register in preview/dev.
- Keep the optional school contact in the shared School record and render it through ReportSheet so local/cloud saves and all report exports use the same value.
- Individual print licenses lock to the first class printed via record_print_class; school/developer licenses and class-less prints (Q&A) are unrestricted — closes the multi-class loophole.
- Certificate editor preferences remain transient display state; CertificatePreview fits the unchanged millimetre sheet on screen and resets fitting for print, so school data and licensed print accounting stay separate.
- Certificate emblems use shared vector artwork and a symmetric three-column signature footer with a separate stamp slot; typography sizing is display-only so templates and record data stay unchanged.
- Certificate signer edits and uploaded signatures remain transient studio state; role-aware defaults read saved school details without changing report-card assets. Shared SVG rosettes use unique IDs per rendered sheet to keep batch printing independent.
- Q&A selection maps displayed learning areas to exact available banks and leaves missing banks unavailable; English written packs keep composition choices, passage and literature together with their marking schemes.
- Lower-primary Q&A uses an independent browser-safe seeded generator and grade-filtered original banks; never fall back to upper-primary or JHS content because younger learners need shorter, concrete tasks.
- Certificate design elements are a static CDN catalogue (src/lib/certElements.ts) placed as transient % -positioned layers on CertificateSheet; they never touch licensing or school data.
