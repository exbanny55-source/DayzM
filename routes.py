import subprocess
import sys
from flask import request, jsonify
from paths_manager import load_paths, save_paths, get_fields
from flask import Blueprint, render_template, url_for, abort, request, jsonify
from settings_manager import load_settings, save_settings

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
    return render_template("index.html", **_common_context())


@main_bp.route("/api/page/<name>")
def api_page(name):
    allowed = {"servers", "game", "mods", "settings", "music"}
    if name not in allowed:
        abort(404)
    return render_template(f"pages/{name}.html")

@main_bp.route("/api/settings", methods=["GET"])
def api_settings_get():
    return jsonify(load_settings())


@main_bp.route("/api/settings", methods=["POST"])
def api_settings_post():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"ok": False, "error": "Invalid JSON"}), 400
    try:
        save_settings(data)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    return jsonify({"ok": True})

# ── API путей ──

@main_bp.route("/api/paths", methods=["GET"])
def api_paths_get():
    """Отдаёт текущие пути + описание полей."""
    return jsonify({
        "values": load_paths(),
        "fields": get_fields()
    })


@main_bp.route("/api/paths", methods=["POST"])
def api_paths_post():
    """Сохраняет пути."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"ok": False, "error": "Invalid JSON"}), 400

    try:
        save_paths(data)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    return jsonify({"ok": True})


@main_bp.route("/api/pick-path", methods=["POST"])
def api_pick_path():
    """
    Запускает Tkinter-диалог в отдельном процессе.
    Возвращает выбранный путь.
    """
    data = request.get_json(silent=True) or {}
    dialog_type = data.get("type", "dir")
    initial     = data.get("initial", "")
    filetypes   = data.get("filetypes", "")

    cmd = [sys.executable, "dialog.py", dialog_type]
    if initial:
        cmd.append(initial)
    if filetypes:
        cmd.append(filetypes)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        path = (result.stdout or "").strip()
        return jsonify({"ok": True, "path": path})
    except subprocess.TimeoutExpired:
        return jsonify({"ok": False, "error": "Таймаут диалога"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

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