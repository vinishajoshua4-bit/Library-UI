# Municipal Library - online library management UI

Open `index.html` in any browser. No install, no server, no internet needed (fonts fall back to system fonts offline).

## Features
- Catalog with search (title or author), category filter, and "available only" toggle
- Borrow a book: copy count drops, 14-day due date is set
- My loans tab: due dates, "due soon" (3 days or less) and overdue highlighting, Return button
- Two sample members; each sees only their own loans
- Data persists in the browser (localStorage); light and dark themes; mobile friendly

## Files
- `index.html`  page structure
- `css/style.css`  colors, layout, dark mode
- `js/data.js`  book list and category colors (edit to add books)
- `js/app.js`  borrow/return logic, rendering, saving

## Customize
- Add a book: add an object to `BOOKS` in `js/data.js` with a unique `id`
- Change loan length: change `14*DAY` in `js/app.js`
- Reset demo data: clear the site's localStorage key `lib-state`

## Next steps toward production
Replace `state` and `save()` in `js/app.js` with API calls (for example `GET /books`, `POST /loans`, `DELETE /loans/:id`) backed by a database, then add login, an admin screen for adding books, and fines.

## Visual effects (v2)
- 6 effect themes (classic, aurora, neon, sunset, forest, ocean) with animated gradients and floating particles; choice is remembered
- Rotating 3D book carousel and 3D tilting book covers
- Live stats and colored shelf-usage bars
- Confetti burst on borrow; respects "reduce motion" settings

## Upgrades (v3)
- Reserve books with no free copies; a returned copy passes to the next person on the waitlist
- Renew once (+7 days), overdue fines (Rs 2 per day), and a demo button that fast-forwards 10 days
- Favorites (heart), favorites filter, and sorting by title, newest, or most available
- "Add book" tab: new books appear in the catalog, stats, and 3D carousel
