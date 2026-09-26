"""
Сканирование папки с музыкой.

- Читает путь из paths.json (music_folder).
- Кэширует результат в памяти.
- Читает длительность треков через mutagen.
- Дисковый кэш метаданных (music_meta.json) — по пути+размеру файла.
- Скан при: старте сервера, ручном refresh, изменении пути.
"""

import os
import json

from mutagen import File as MutagenFile
from paths_manager import load_paths


AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".opus", ".wma"}

META_CACHE_PATH = "music_meta.json"


# ────────────────────────── Кэш в памяти ──────────────────────────

_cache = {
    "folder": None,      # путь, для которого построен кэш
    "result": None       # готовый dict (см. _scan)
}


# ────────────────────────── Утилиты ──────────────────────────

def _format_size(size_bytes: int) -> str:
    for unit in ("Б", "КБ", "МБ", "ГБ"):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} ТБ"


def get_music_folder() -> str:
    return load_paths().get("music_folder", "").strip()


# ────────────────────────── Дисковый кэш метаданных ──────────────────────────

def _load_meta_cache() -> dict:
    """Читает music_meta.json. Если файла нет — пустой dict."""
    if not os.path.exists(META_CACHE_PATH):
        return {}
    try:
        with open(META_CACHE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_meta_cache(cache: dict) -> None:
    """Сохраняет music_meta.json."""
    try:
        with open(META_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[music] Не удалось сохранить кэш метаданных: {e}")


def _get_duration(path: str) -> float:
    """
    Возвращает длительность файла в секундах.
    0.0 — если не удалось определить (например, WAV без заголовка).
    """
    try:
        audio = MutagenFile(path)
        if audio is None:
            return 0.0
        info = getattr(audio, "info", None)
        if info is None:
            return 0.0
        length = getattr(info, "length", None)
        if length is None:
            return 0.0
        return float(length)
    except Exception:
        return 0.0


# ────────────────────────── Сканирование ──────────────────────────

def _scan() -> dict:
    """Реально сканирует папку и возвращает dict."""
    folder = get_music_folder()

    result = {
        "folder": folder,
        "exists": False,
        "tracks": [],
        "error": ""
    }

    if not folder:
        result["error"] = "Папка с музыкой не указана в настройках."
        return result

    if not os.path.isdir(folder):
        result["error"] = f"Папка не найдена: {folder}"
        return result

    result["exists"] = True

    try:
        entries = os.listdir(folder)
    except PermissionError:
        result["error"] = "Нет доступа к папке."
        return result
    except OSError as e:
        result["error"] = f"Ошибка чтения: {e}"
        return result

    old_cache = _load_meta_cache()
    new_cache = {}

    tracks = []
    for name in entries:
        full = os.path.join(folder, name)
        if not os.path.isfile(full):
            continue

        ext = os.path.splitext(name)[1].lower()
        if ext not in AUDIO_EXTS:
            continue

        try:
            size = os.path.getsize(full)
        except OSError:
            size = 0

        # Ключ кэша — путь + размер (чтобы замечать изменение файла)
        cache_key = f"{full}|{size}"

        if cache_key in old_cache:
            duration = old_cache[cache_key]
        else:
            duration = _get_duration(full)

        new_cache[cache_key] = duration

        tracks.append({
            "name": os.path.splitext(name)[0],
            "file": name,
            "ext": ext.lstrip("."),
            "size": _format_size(size),
            "size_bytes": size,
            "path": full,
            "duration": round(duration, 1) if duration else 0
        })

    tracks.sort(key=lambda t: t["name"].lower())
    result["tracks"] = tracks

    # Сохраняем обновлённый кэш (удаляем устаревшие записи)
    _save_meta_cache(new_cache)

    return result


# ────────────────────────── Публичное API ──────────────────────────

def refresh_cache() -> dict:
    """Принудительный скан + обновление кэша."""
    folder = get_music_folder()
    result = _scan()
    _cache["folder"] = folder
    _cache["result"] = result
    count = len(result.get("tracks", []))
    print(f"[music] Скан папки: {folder or '(не задана)'} → {count} треков")
    return result


def get_tracks(force_refresh: bool = False) -> dict:
    """
    Возвращает список треков.
    - force_refresh=True → пересканировать и обновить кэш.
    - Иначе → отдать из кэша (скан при старте сервера / смене пути).
    """
    if force_refresh:
        return refresh_cache()

    folder_now = get_music_folder()

    if _cache["result"] is None or _cache["folder"] != folder_now:
        return refresh_cache()

    return _cache["result"]


def clear_cache() -> None:
    """Сбросить кэш в памяти (например, при смене music_folder)."""
    _cache["folder"] = None
    _cache["result"] = None