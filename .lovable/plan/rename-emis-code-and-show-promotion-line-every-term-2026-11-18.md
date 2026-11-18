# Rename EMIS code and show promotion line every term

## What changes
1. Every place that says "EMIS code" now says "School code": School Details field and placeholder, school admin panel, quick menu description ("Name, motto, school code, logo"), and the sync clash label.
2. Report card: the Promotion line always shows.
   - Term 1 and Term 2: "Promoted to: —"
   - Term 3: unchanged — real result (Promoted to Basic X / Retained in … / To be decided).

## Technical details
- Labels only; the stored field `emisCode` keeps its name so saved data is untouched.
- Files: setup.tsx, SchoolAdmin.tsx, AppHeader.tsx, schoolSync.ts, ReportSheet.tsx (replace the `<p />` fallback with the "Promoted to: —" line).
- Scoring, layout spacing and print licensing unchanged.
