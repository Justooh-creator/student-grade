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
- Lesson-note document exports live in a browser-safe, dynamically loaded export module; generate PDF and DOCX directly so downloads do not depend on browser printing.
