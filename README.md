# Cimy Dataset Workbench

A private, single-user dataset curation tool for building LLM conversation
datasets. Next.js (App Router) + TypeScript + Firebase Auth + Firestore
(via the Admin SDK) + Vercel.

## Features

- Email/password login (no public registration)
- Dashboard: counts by status, recent conversations, duplicate-flag summary
- Conversation list: search, status filter, cursor-based pagination
- Visual conversation editor: add/remove/reorder message turns, pick
  role per message (no manual JSON, no "Speaker: text" blobs)
- Duplicate detection: flags exact + near-duplicate conversations for
  manual review — never auto-deletes or auto-merges
- JSONL export, preserving structured `{role, content}` messages
- Every `/api/conversations*` route requires a valid Firebase ID token
  server-side (checked via `verifyIdToken`, not just hidden UI)

## Project structure

```
src/
  app/
    login/                      sign-in page
    dashboard/                  stats + recent conversations
    conversations/
      page.tsx                  list, search, filter, export
      new/                      create conversation
      [id]/                     view/edit/delete a conversation
      duplicates/               review flagged duplicate pairs
    api/
      conversations/            POST + GET (list/search)
      conversations/[id]/       GET, PATCH, DELETE
      conversations/duplicates/ GET (detect), POST (ignore a pair)
      conversations/export/     GET JSONL
      dashboard/stats/          GET dashboard aggregates
  components/                   AuthProvider, RequireAuth, AppNav,
                                 MessageEditor, StatusBadge, LogoutButton
  lib/
    firebase/                   client.ts (browser), admin.ts (server-only)
    auth/verifyAuth.ts          verifies the Bearer token on API routes
    validation/conversation.ts  schema validation (spec section 5)
    data/                       Firestore access: conversations, ID
                                 counter, duplicate-ignore records
    duplicates/similarity.ts    exact-hash + Jaccard near-duplicate logic
    hooks/useAuthFetch.ts       client fetch wrapper that attaches the
                                 ID token automatically
firestore.rules                 denies all direct client access
firestore.indexes.json          composite indexes the queries need
```

## Prerequisites

1. A Firebase project with **Firestore (Native mode)** and
   **Authentication → Email/Password** enabled.
2. In Firebase Console → Authentication → Users, manually add your one
   user (email + password). There is no sign-up page, by design.
3. A registered Web App in the Firebase project (for client config values).
4. A service account key: Project Settings → Service Accounts →
   Generate new private key (for Admin SDK values).

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

- `NEXT_PUBLIC_*` values are safe to expose to the browser (standard
  Firebase client config).
- `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
  are **server-only secrets** — never prefixed `NEXT_PUBLIC_`, never sent
  to the client. `.env.local` is git-ignored.
- Keep the private key's `\n` sequences literal when pasting; the code
  converts them back to real newlines at runtime.
- On Vercel: Project Settings → Environment Variables, same names.

## Install & run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` → redirects to `/dashboard` → (signed out)
redirects to `/login`.

## Firestore rules & indexes

The client never talks to Firestore directly — every read/write goes
through an API route using the Admin SDK, which bypasses security rules.
`firestore.rules` denies direct client access as defense-in-depth.

Two queries (status-filtered list, and search combined with a status
filter) need composite indexes, defined in `firestore.indexes.json`. Deploy
them with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

Alternatively, just use the app: if an index is missing, Firestore returns
an error containing a direct "create index" link — click it once and the
index builds itself (this is normal first-run Firestore behavior).

## Testing the flow end to end

1. **Login** with the user you created in Firebase.
2. **Dashboard** shows zeroed stats initially.
3. **New conversation**: `/conversations/new` → add a couple of message
   turns, toggling user/assistant per block → Save. You're redirected to
   the editor for the new `conv_000001`.
4. **List & filter**: `/conversations` → filter by status tabs, search by
   a word from the content, confirm results update.
5. **Edit**: change status to `flagged`, edit a message, Save — refresh
   and confirm it persisted.
6. **Delete**: from the list or editor, delete a conversation — confirm
   the browser confirmation prompt appears and it's gone after confirming.
7. **Duplicates**: create two conversations with near-identical content,
   then visit `/conversations/duplicates` — the pair should be flagged.
   Click "Keep both / Ignore flag" and confirm it disappears from the list
   (and stays gone on refresh).
8. **Export**: `/conversations` → "Export JSONL" → downloads a `.jsonl`
   file, one conversation object per line, with structured `messages`.
9. **Auth enforcement**: sign out, then in dev tools run
   `fetch("/api/conversations").then(r => r.json()).then(console.log)` —
   expect `401` / `UNAUTHENTICATED`, confirming the API doesn't rely on
   the UI to enforce auth.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel, set the environment variables above (both the
   `NEXT_PUBLIC_*` and the Admin SDK ones) for the Production (and
   Preview, if used) environment.
3. Deploy. Firestore rules/indexes are managed separately via the
   Firebase CLI (see above), not by Vercel.
4. In Firebase Console → Authentication → Settings → Authorized domains,
   add your Vercel deployment domain.

## Notes on scope

- Not implemented, per spec: model training, tokenizer training, EOS
  logic, model inference, automatic import/migration of old datasets, or
  automatic merging of duplicates. Duplicate "merge" is intentionally
  left as detection + manual review only.
- Search is a lightweight server-side token-overlap match (a
  `searchTokens` field computed at write time), not a full-text search
  engine — sufficient for a personal dataset tool without requiring the
  browser to ever load the full dataset.
- Duplicate detection runs an O(n²) comparison across the dataset on
  demand (capped at 5000 conversations); fine at the scale this tool
  targets, but not built for a massive corpus.
