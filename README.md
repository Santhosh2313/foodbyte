# Online Food Reservation System (Python + DBMS)

A Flask web app for managing food reservations with a simple frontend and SQL-backed API.

## Stack
- Backend: Flask
- ORM/DB: Flask-SQLAlchemy
- Frontend: HTML/CSS/JavaScript

## Local Setup
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Open: `http://127.0.0.1:5000`

## Features
- Create reservation
- List reservations
- Delete reservation
- Execute controlled DBMS operations from UI (`INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`)

## Vercel Deployment
Important: SQLite is not persistent on Vercel serverless functions. Use a hosted Postgres database for production.

1. Push this repo to GitHub.
2. In Vercel, import this repository.
3. Set environment variable:- `DATABASE_URL` = your Postgres connection string
4. Deploy.

This repo already includes:
- `vercel.json` routing to `api/index.py`
- `api/index.py` as the Vercel Python entrypoint
- `DATABASE_URL` support in app config

## Git Commands (PowerShell)
```powershell
git add .
git commit -m "Configure Vercel deployment"
git push
```
