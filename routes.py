import os
from flask import send_from_directory
from paths_manager import load_paths
import subprocess
import sys

from flask import (
    Blueprint, render_template, url_for, abort,
    request, jsonify
)

from settings_manager import load_settings, save_settings
from paths_manager import load_paths, save_paths, get_fields
from music_manager import get_tracks, clear_cache


main_bp = Blueprint("main", __name__)


# ────────────────────────── helpers ──────────────────────────

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


# ────────────────────────── страницы ──────────────────────────

@main_bp.route("/")
def index():
    return render_template("index.html", **_common_context())


@main_bp.route("/api/page/<name>")
def api_page(name):
    allowed = {"servers", "game", "mods", "settings", "music"}
    if name not in allowed:
        abort(404)
    return render_template(f"pages/{name}.html")


# ────────────────────────── настройки (settings.json) ──────────────────────────

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


# ────────────────────────── пути (paths.json) ──────────────────────────

@main_bp.route("/api/paths", methods=["GET"])
def api_paths_get():
    return jsonify({
        "values": load_paths(),
        "fields": get_fields()
    })


@main_bp.route("/api/paths", methods=["POST"])
def api_paths_save():
    """Сохраняет пути. Если music_folder изменился — сбрасывает кэш музыки."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"ok": False, "error": "Invalid JSON"}), 400

    try:
        old_music = load_paths().get("music_folder", "")
        new_music = data.get("music_folder", "")

        save_paths(data)

        if old_music != new_music:
            clear_cache()
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    return jsonify({"ok": True})


# ────────────────────────── Tkinter диалог ──────────────────────────

@main_bp.route("/api/pick-path", methods=["POST"])
def api_pick_path():
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



# ────────────────────────── музыка ──────────────────────────

@main_bp.route("/api/music/list", methods=["GET"])
def api_music_list():
    """
    Список треков.
    ?refresh=1 — принудительный пересбор кэша.
    Иначе — из кэша (скан при старте сервера / после смены music_folder).
    """
    force = request.args.get("refresh", "").lower() in ("1", "true", "yes")
    return jsonify(get_tracks(force_refresh=force))

@main_bp.route("/api/music/stream/<path:filename>")
def api_music_stream(filename):
    """
    Отдаёт аудиофайл из папки music_folder.
    filename — имя файла (без пути), например: track.mp3
    """
    folder = load_paths().get("music_folder", "").strip()
    if not folder or not os.path.isdir(folder):
        abort(404)

    # Защита от path traversal — берём только имя файла
    safe_name = os.path.basename(filename)
    full = os.path.join(folder, safe_name)

    if not os.path.isfile(full):
        abort(404)

    return send_from_directory(folder, safe_name)