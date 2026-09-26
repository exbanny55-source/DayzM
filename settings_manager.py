"""
Управление settings.json: создание, загрузка, обновление.

sync_settings() вызывается при старте приложения.
load_settings() вызывается на каждый запрос для чтения свежих данных.
"""

import json
import os

SETTINGS_PATH = "settings.json"

DEFAULT_SETTINGS = {
    "background": {
        "type": "local",
        "source": "images/fon.jpg",
        "animation": {
            "enabled": True,
            "duration": 120000,
            "pos_from": 20,
            "pos_to": 100,
            "zoom": {
                "from": 1.0,
                "to": 1.4
            }
        }
    },
    "frame": {
        "margin": 20,
        "blur": 10,
        "opacity": 0.25,
        "border_radius": 15,
        "border_width": 1
    },
    "sidebar": {
        "title": "Dayz Менеджер",
        "width": 240,
        "background": "transparent",
        "border_width": 1,
        "border_color": "rgba(255, 255, 255, 0.2)",
        "menu_style": {
            "item_border_width": 1,
            "item_border_color": "rgba(255, 255, 255, 0.15)",
            "item_border_radius": 8,
            "item_hover_border_color": "rgba(255, 255, 255, 0.4)"
        },
        "menu": [
            { "enabled": True, "label": "Управление Сервером", "icon": "server",   "page": "servers" },
            { "enabled": True, "label": "Управление Игрой",    "icon": "game",     "page": "game" },
            { "enabled": True, "label": "Управление Модами",   "icon": "mod",      "page": "mods" }
        ],
        "footer": {
            "background": "rgba(255, 255, 255, 0.05)",
            "border_top_width": 1,
            "border_top_color": "rgba(255, 255, 255, 0.1)",
            "menu": [
                { "enabled": True, "label": "Настройки", "icon": "settings", "page": "settings" }
            ]
        }
    }
}
def _merge(default: dict, current: dict) -> dict:
    """Рекурсивно добавляет в current отсутствующие ключи из default."""
    result = current.copy()
    for key, value in default.items():
        if key not in result:
            result[key] = value
        elif isinstance(value, dict) and isinstance(result[key], dict):
            result[key] = _merge(value, result[key])
    return result


def _save(data: dict) -> None:
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load() -> dict:
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def sync_settings(force: bool = False) -> dict:
    """
    - Нет файла          → создаёт с дефолтами.
    - Есть, но неполный  → дополняет недостающими ключами.
    - Есть, всё на месте → ничего не делает.
    - force=True         → перезаписывает дефолтами.
    """
    if not os.path.exists(SETTINGS_PATH) or force:
        _save(DEFAULT_SETTINGS)
        print(f"[+] Создан {SETTINGS_PATH}")
        return DEFAULT_SETTINGS

    current = _load()
    merged = _merge(DEFAULT_SETTINGS, current)

    if merged != current:
        _save(merged)
        print(f"[+] {SETTINGS_PATH} дополнен новыми ключами:")
        for section, value in merged.items():
            if section not in current:
                print(f"    + {section}")
            elif isinstance(value, dict):
                for k in value:
                    if k not in current.get(section, {}):
                        print(f"    + {section}.{k}")
                    elif isinstance(value[k], dict):
                        for sub in value[k]:
                            if sub not in current[section].get(k, {}):
                                print(f"    + {section}.{k}.{sub}")
    else:
        print(f"[i] {SETTINGS_PATH} актуален.")

    return merged


def load_settings() -> dict:
    """Читает settings.json. Если файла нет — создаёт."""
    if not os.path.exists(SETTINGS_PATH):
        return sync_settings()
    return _load()


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    settings = sync_settings(force=force)
    print(json.dumps(settings, indent=2, ensure_ascii=False))