import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def create_app() -> Flask:
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        # SQLAlchemy expects postgresql:// scheme.
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///food_reservation.db"

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    from .routes import bp as main_bp

    app.register_blueprint(main_bp)

    with app.app_context():
        try:
            db.create_all()
        except Exception:
            # Avoid hard-crashing on platforms with read-only/ephemeral filesystems.
            pass

    return app
