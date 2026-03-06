# Online Food Reservation System

Flask-based web app to create, update, list, and delete reservations, plus run controlled SQL commands from the UI.

## Tech Stack
- Backend: Flask
- Database Layer: Flask-SQLAlchemy
- Frontend: HTML, CSS, JavaScript

## App Flow (Flowchart)
```mermaid
flowchart TD
    U[User] --> F[Frontend UI]
    F -->|Create / Update / Delete Reservation| A[/Flask API: /api/reservations/]
    F -->|List All / Upcoming| B[/Flask API: /api/reservations, /api/reservations/upcoming/]
    F -->|Run SQL (DDL/DML/DCL)| C[/Flask API: /api/db/execute/]
    A --> D[(SQLite or Postgres)]
    B --> D
    C --> D
    D --> F
```

## Features
- Create reservation
- Update reservation
- Delete reservation
- View upcoming reservations
- View all reservations
- Execute controlled SQL from UI

## Supported SQL Commands
- DDL: `CREATE`, `ALTER`, `DROP`, `TRUNCATE`
- DML: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- DCL: `GRANT`, `REVOKE`

## Quick Start (Local)
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Open: `http://127.0.0.1:5000`

## API Endpoints
- `GET /api/reservations` - all reservations
- `GET /api/reservations/upcoming` - upcoming reservations
- `POST /api/reservations` - create reservation
- `PUT /api/reservations/<id>` - update reservation
- `DELETE /api/reservations/<id>` - delete reservation
- `POST /api/db/execute` - run controlled SQL

## Deployment (Vercel)
SQLite is not persistent on Vercel serverless functions. Use hosted Postgres in production.

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variable: `DATABASE_URL=<postgres-connection-string>`.
4. Deploy.

Already configured:
- `vercel.json`
- `api/index.py` (Vercel entrypoint)
- `DATABASE_URL` handling in app config
