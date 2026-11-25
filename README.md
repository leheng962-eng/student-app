# Student Management System

Vue 3 (Vite) frontend + Node/Express API + nginx reverse proxy, all run with Docker Compose.

## Features
- List, search, add, edit, delete students
- Stats cards (total / male / female)
- Data saved in a Docker volume (survives restarts)

## Project structure
```
student-app/
├── backend/          Node API (server.js, Dockerfile)
├── frontend/         Vue app (src/App.vue, Dockerfile, nginx.conf)
├── nginx/default.conf  public reverse proxy (port 80 and 8000)
├── docker-compose.yml
└── .env
```

## API
| Method | URL | Description |
|---|---|---|
| GET | /api/students | List (optional `?search=`) |
| GET | /api/students/:id | Get one |
| POST | /api/students | Create |
| PUT | /api/students/:id | Update |
| DELETE | /api/students/:id | Delete |

## Run locally (no Docker)
```bash
cd backend && npm install && npm start          # http://localhost:8000
cd frontend && npm install && npm run dev       # http://localhost:5173
```

## Deploy with 3 links (DuckDNS)
1. On duckdns.org create 2 subdomains, both pointing to your server IP:
   - `YOUR-FRONTEND` (e.g. `student-system`)
   - `YOUR-API` (e.g. `student-api`)
2. Replace `YOUR-FRONTEND` and `YOUR-API` in:
   - `nginx/default.conf` (2 places)
   - `.env` (`VITE_API_URL`)
3. Open ports 80 and 8000 (server firewall and cloud firewall).
4. On the server:
```bash
docker compose up -d --build
```

## Your 3 links
- Frontend: http://YOUR-FRONTEND.duckdns.org
- Backend:  http://YOUR-API.duckdns.org:8000
- API:      http://YOUR-API.duckdns.org:8000/api/students

If you change `VITE_API_URL`, rebuild: `docker compose up -d --build`.
