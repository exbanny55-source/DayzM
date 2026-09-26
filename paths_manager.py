"""
Управление paths.json — конфиг путей к папкам/файлам DayZ.
Хранится отдельно от settings.json.
"""

import json
import os

PATHS_FILE = "paths.json"

DEFAULT_PATHS = {
    "server_folder":  "",     # путь до папки сервера
    "dayz_exe":       "",     # путь до DayZ_x64.exe
    "workshop_folder": "",    # путь до папки воркшоп
    "my_mods_folder":  "",    # путь до папки своих модов
    "music_folder":    ""     # путь до папки с музыкой
}

# Метаданные полей — для UI и валидации
PATH_FIELDS = [
    {
        "key":         "server_folder",
        "label":       "Папка сервера",
        "description": "Корневая папка серверной части DayZ",
        "type":        "dir"
    },
    {
        "key":         "dayz_exe",
        "label":       "DayZ_x64.exe",
        "description": "Исполняемый файл клиента DayZ",
        "type":        "file",
        "filetypes":   [("Executable", "*.exe"), ("All files", "*.*")]
    },
    {
        "key":         "workshop_folder",
        "label":       "Папка воркшоп",
        "description": "Папка со скачанными модами Steam Workshop",
        "type":        "dir"
    },
    {
        "key":         "my_mods_folder",
        "label":       "Папка своих модов",
        "description": "Ваши локальные/собственные моды",
        "type":        "dir"
    },
    {
        "key":         "music_folder",
        "label":       "Папка с музыкой",
        "description": "Аудиофайлы для раздела «Музыка»",
        "type":        "dir"
    }
]


def _save(data: dict) -> None:
    with open(PATHS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load() -> dict:
    with open(PATHS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def sync_paths(force: bool = False) -> dict:
    """
    Создаёт paths.json, если его нет, и дополняет недостающие ключи.
    Существующие пути НЕ трогает.
    """
    if not os.path.exists(PATHS_FILE) or force:
        _save(DEFAULT_PATHS)
        print(f"[+] Создан {PATHS_FILE}")
        return DEFAULT_PATHS

    current = _load()
    merged = current.copy()

    added = []
    for key, value in DEFAULT_PATHS.items():
        if key not in merged:
            merged[key] = value
            added.append(key)

    if added:
        _save(merged)
        print(f"[+] {PATHS_FILE} дополнен ключами: {', '.join(added)}")
    else:
        print(f"[i] {PATHS_FILE} актуален.")

    return merged


def load_paths() -> dict:
    if not os.path.exists(PATHS_FILE):
        return sync_paths()
    return _load()


def save_paths(data: dict) -> None:
    # Сливаем с дефолтами, чтобы лишние ключи не сохранялись, а нужные не терялись
    result = DEFAULT_PATHS.copy()
    for key in DEFAULT_PATHS:
        if key in data:
            result[key] = str(data[key] or "").strip()
    _save(result)


def get_fields() -> list:
    """Метаданные полей для передачи в UI."""
    return PATH_FIELDS