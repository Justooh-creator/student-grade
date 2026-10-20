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
- All app content lives under the client-only _authenticated layout while auth and password recovery stay public; preserve existing URLs and keep payment checks separate from account access.
- A single root AccountProvider owns session transitions and cache invalidation; useUser consumes it so page mounts cannot create competing auth listeners.
- Spreadsheet reader libraries are dynamically loaded from the learner-upload action; imports are append-only and recheck class permissions, duplicates and capacity against current store data before one update.
- Broadsheets derive results and exact-stream ranking from the existing results module, use named landscape print pages, and reuse the existing PrintButton license gate so report-card grading and print rules remain unchanged.
- Privacy is a public content route; school records and broadsheets stay under the client-only authenticated layout.
- Keep both public manifest filenames identical after any metadata update for packaging-tool compatibility.
- Generate Mathematics Q&A packs in a browser-safe seeded module; keep one pack in page state for quiz, exam and scheme so answers and printing never regenerate independently.
