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
- School data syncs via school_students/schools tables (one JSON row per learner); store.ts onLocalChange/applyRemote drive SyncListener — cloud is source of truth once a teacher joins a school.
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
- Offline support uses vite-plugin-pwa generateSW with one guarded registrar (src/lib/registerSW.ts); never hand-write sw.js or register in preview/dev.
