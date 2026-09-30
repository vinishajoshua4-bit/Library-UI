# Municipal Library - full website

A real web app: Node server + accounts + persistent database file. No dependencies (Node 18+ only).

## Run locally
    node server.js        # then open http://localhost:3000

The first account you create becomes the librarian (can add books). Data lives in `data/db.json`.

## Features
Accounts with hashed passwords and signed session cookies; catalog search, filter, sort; borrow, return, renew (once), reserve with automatic waitlist hand-off; fines shown for overdue loans (Rs 2/day); favorites; librarian "Add book"; 6 effect themes, 3D covers, live stats.

## Put it online permanently
1. Push this folder to a GitHub repository.
2. Pick a host that runs Docker or Node and gives you a persistent disk/volume (Render, Railway, or Fly.io all do). Point it at the repo; the `Dockerfile` and `render.yaml` are ready.
3. Mount the persistent disk at `/data` (the Dockerfile sets `DATA_DIR=/data`). Without a persistent disk the data is wiped on every redeploy.
4. Open the URL the host gives you, create the first account (that is the librarian), and add a custom domain in the host's settings if you want one. HTTPS is provided by the host.

## Environment variables
`PORT` (default 3000), `DATA_DIR` (default ./data).

## Backups and limits
Back up by copying `db.json`. This design suits one small library on one server. For many branches or heavy traffic, move the data to PostgreSQL (all data access is in `server.js`).
