# Tech Product Showcase - Single-Table CRUD (Node.js + Express + SQLite)

Resource: `products` (Question 5)

## Run locally
```powershell
cd backend
npm install
npm start
```
Open http://localhost:3000 (the Express server also serves the `frontend/` folder).
The database file is created and seeded with 12 products on first start.

## API
| Method | URL | Body |
|---|---|---|
| GET | /api/products | - |
| GET | /api/products/:id | - |
| POST | /api/products | `{"product_name":"Pixel Buds Pro","brand":"Google","category":"Earbuds","price":199,"stock_quantity":20,"description":"ANC earbuds"}` |
| PUT | /api/products/:id | same fields as POST (full update) |
| DELETE | /api/products/:id | - |

Status codes: 200 OK, 201 Created, 400 validation error, 404 not found.

## Deploy on Render (free)
1. Push this folder to GitHub.
2. Render -> New -> Web Service -> pick the repo.
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Env vars: `PORT` is set by Render; add `DB_PATH=./data/products.db`
3. Your links: `https://<app>.onrender.com/api/products` (and `/` for the UI).

Note: free instances have a temporary disk, so data resets on redeploy/restart.
The seed runs again automatically when the table is empty. For permanent data,
attach a Render Disk (set `DB_PATH=/var/data/products.db`) or move to Supabase.
