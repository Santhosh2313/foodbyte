import os
import tempfile
from pathlib import Path

from flask import Flask
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def _build_sqlite_uri(app: Flask) -> str:
    preferred_dir = Path(app.instance_path)
    fallback_dir = Path(tempfile.gettempdir())
    db_name = "food_reservation.db"

    for target_dir in (preferred_dir, fallback_dir):
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            db_path = target_dir / db_name
            db_path.touch(exist_ok=True)
            return f"sqlite:///{db_path.as_posix()}"
        except OSError:
            continue

    # Last-resort relative DB path if both absolute locations are unavailable.
    return "sqlite:///food_reservation.db"


def create_app() -> Flask:
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        # SQLAlchemy expects postgresql:// scheme.
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = _build_sqlite_uri(app)

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    from .routes import bp as main_bp

    app.register_blueprint(main_bp)

    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:
            app.logger.warning("Database initialization failed: %s", exc)

    return app
