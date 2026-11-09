# Social (React + Vite + TypeScript)

UI has been aligned to the Route Posts demo style, including:
- Auth screens (`/auth/login`, `/auth/register`)
- Main shell style (navbar + feed cards)
- Notifications and profile pages with the same visual system
- Profile data loaded from `GET /users/profile-data`
- Feed/posts connected to API endpoints (`/posts/feed`, `PUT /posts/:id/like`, `POST /posts/:id/comments`, `POST /posts/:id/share`, `PUT /posts/:id/bookmark`)
- Profile tabs connected to API (`GET /posts/feed?only=me` and `GET /users/bookmarks`)

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
