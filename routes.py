from flask import Blueprint, render_template, url_for, abort
from settings_manager import load_settings

main_bp = Blueprint("main", __name__)


def _resolve_background(settings: dict) -> str:
    bg = settings.get("background", {})
    source = bg.get("source", "")
    bg_type = bg.get("type", "url")
    if bg_type == "local":
        return url_for("static", filename=source)
    return source


def _common_context():
    settings = load_settings()
    anim = settings.get("background", {}).get("animation", {})
    return {
        "background_url": _resolve_background(settings),
        "frame": settings.get("frame", {}),
        "bg_anim": anim,
        "zoom": anim.get("zoom", {"from": 1.0, "to": 1.4}),
        "sidebar": settings.get("sidebar", {}),
    }


@main_bp.route("/")
def index():
    """Единственная страница приложения."""
    return render_template("index.html", **_common_context())


@main_bp.route("/api/page/<name>")
def api_page(name):
    """
    Отдаёт HTML-фрагмент страницы (внутренность .content).
    Файлы лежат в templates/pages/<name>.html
    """
    allowed = {"servers", "game", "mods", "settings"}
    if name not in allowed:
        abort(404)
    return render_template(f"pages/{name}.html")