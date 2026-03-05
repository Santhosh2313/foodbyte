import os

from app import create_app

app = create_app()


def _get_bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_port(default: int = 5000) -> int:
    raw = os.getenv("FLASK_RUN_PORT")
    if raw is None:
        return default

    try:
        port = int(raw)
    except ValueError:
        return default

    return port if 1 <= port <= 65535 else default


if __name__ == "__main__":
    debug = _get_bool_env("FLASK_DEBUG", default=False)
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = _get_port(default=5000)

    app.run(host=host, port=port, debug=debug, use_reloader=debug)
