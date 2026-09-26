"""
Все роуты приложения — в одном Blueprint.
"""

from flask import Blueprint, render_template, url_for
from settings_manager import load_settings

# Создаём Blueprint — потом регистрируем в app.py
main_bp = Blueprint("main", __name__)


def _resolve_background(settings: dict) -> str:
    """Превращает настройку фона в готовый URL."""
    bg = settings.get("background", {})
    source = bg.get("source", "")
    bg_type = bg.get("type", "url")

    if bg_type == "local":
        return url_for("static", filename=source)
    return source


@main_bp.route("/")
def index():
    settings = load_settings()
    background_url = _resolve_background(settings)
    frame = settings.get("frame", {})
    bg_anim = settings.get("background", {}).get("animation", {})
    zoom = bg_anim.get("zoom", {"from": 1.0, "to": 1.4})

    return render_template(
        "index.html",
        background_url=background_url,
        frame=frame,
        bg_anim=bg_anim,
        zoom=zoom
    )
