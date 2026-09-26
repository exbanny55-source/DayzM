"""
Загрузка/создание/обновление settings.json.

- sync_settings() вызывается при старте app.py.
- Умное слияние: словари дополняются ключами, списки — элементами.
- Существующие значения НЕ перезаписываются.

Ручной сброс: python settings_manager.py --force
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
        "border_radius": 15,
        "border_width": 1,
        "border_color": "rgba(255, 255, 255, 0.5)",
        "background": "rgba(16, 21, 61, 0.25)",
        "fab_border_width": 1,
        "fab_border_color": "rgba(255, 255, 255, 0.3)",
        "fab_icon_color": "rgba(255, 255, 255, 1)"
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
            { "enabled": True, "label": "Управление Сервером", "icon": "server", "page": "servers" },
            { "enabled": True, "label": "Управление Игрой",    "icon": "game",   "page": "game"    },
            { "enabled": True, "label": "Управление Модами",   "icon": "mod",    "page": "mods"    }
        ],
        "footer": {
            "background": "rgba(255, 255, 255, 0.05)",
            "border_top_width": 1,
            "border_top_color": "rgba(255, 255, 255, 0.1)",
            "menu": [
                { "enabled": True, "label": "Музыка",    "icon": "music",    "page": "music"    },
                { "enabled": True, "label": "Настройки", "icon": "settings", "page": "settings" }
            ]
        }
    }
}


# ────────────────────────── Утилиты ──────────────────────────

def _item_key(item):
    """
    Возвращает уникальный ключ элемента списка.
    Для словарей — page или label. Для скаляров — сам скаляр.
    """
    if isinstance(item, dict):
        return item.get("page") or item.get("label")
    return item


def _merge_lists(default_list: list, current_list: list) -> list:
    """
    Объединяет списки:
    - Сначала идут элементы из default_list в том порядке, как они там.
      Значения берутся из current_list, если ключ совпал.
    - Потом — оставшиеся пользовательские элементы (которых нет в default).
    """
    default_index = {}
    for i, item in enumerate(default_list):
        k = _item_key(item)
        if k is not None:
            default_index[k] = i

    current_by_key = {}
    extras = []   # элементы, которых нет в дефолте

    for item in current_list:
        k = _item_key(item)
        if k is None:
            extras.append(item)
        elif k in default_index:
            current_by_key[k] = item
        else:
            extras.append(item)

    # Собираем результат: сначала дефолтные в порядке default_list
    result = []
    for item in default_list:
        k = _item_key(item)
        if k is None:
            continue
        # Берём из current (с твоими правками), если есть;
        # иначе — из дефолта (новый элемент)
        result.append(current_by_key.get(k, item))

    # Дописываем кастомные в конец
    result.extend(extras)

    return result

def _merge(default: dict, current: dict) -> dict:
    """
    Рекурсивно дополняет current отсутствующими данными из default:
    - ключи словарей (dict) — добавляет
    - элементы списков (list) — добавляет по _item_key
    - скалярные значения — НЕ перезаписывает
    """
    result = current.copy()

    for key, value in default.items():
        if key not in result:
            # ключа нет — берём дефолт целиком
            result[key] = value

        elif isinstance(value, dict) and isinstance(result[key], dict):
            # оба словари — рекурсия
            result[key] = _merge(value, result[key])

        elif isinstance(value, list) and isinstance(result[key], list):
            # оба списка — умное слияние
            result[key] = _merge_lists(value, result[key])

        # иначе — ключ есть, значение скаляр → НЕ ТРОГАЕМ
    return result


# ────────────────────────── CRUD ──────────────────────────

def _load() -> dict:
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_settings(data: dict) -> None:
    """Сохраняет словарь в settings.json."""
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def sync_settings(force: bool = False) -> dict:
    """
    - Нет файла          → создаёт с дефолтами.
    - Есть, но неполный  → дополняет ключами и элементами списков.
    - Есть, всё на месте → ничего не делает.
    - force=True         → перезаписывает дефолтами.
    """
    if not os.path.exists(SETTINGS_PATH) or force:
        save_settings(DEFAULT_SETTINGS)
        print(f"[+] Создан {SETTINGS_PATH}")
        return DEFAULT_SETTINGS

    current = _load()
    merged = _merge(DEFAULT_SETTINGS, current)

    if merged != current:
        save_settings(merged)
        print(f"[+] {SETTINGS_PATH} дополнен:")
        _print_diff(current, merged)
    else:
        print(f"[i] {SETTINGS_PATH} актуален.")

    return merged


def _print_diff(old: dict, new: dict, prefix: str = ""):
    """Печатает, какие ключи/элементы добавились."""
    for key, value in new.items():
        path = f"{prefix}.{key}" if prefix else key

        if key not in old:
            print(f"    + {path}")
        elif isinstance(value, dict) and isinstance(old[key], dict):
            _print_diff(old[key], value, path)
        elif isinstance(value, list) and isinstance(old[key], list):
            old_keys = {_item_key(x) for x in old[key] if _item_key(x) is not None}
            for item in value:
                k = _item_key(item)
                if k is not None and k not in old_keys:
                    print(f"    + {path}[{k}]")


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