"""
Скрипт диалога выбора папки/файла через Tkinter.
Запускается отдельным процессом из Flask.

Использование:
    python dialog.py <type> [initial_path] [filetypes]

    type: dir | file
    initial_path: стартовый путь (опционально)
    filetypes: через запятую, "*.exe,*.txt" (опционально, только для file)

Печатает в stdout выбранный путь или пустую строку, если отменено.
"""

import sys
import tkinter as tk
from tkinter import filedialog


def main():
    dialog_type = sys.argv[1] if len(sys.argv) > 1 else "dir"
    initial     = sys.argv[2] if len(sys.argv) > 2 else ""
    filetypes   = sys.argv[3] if len(sys.argv) > 3 else ""

    # Скрыть главное окно, оставить только диалог
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    result = ""

    try:
        if dialog_type == "file":
            types = [("All files", "*.*")]
            if filetypes:
                ext_list = tuple(e.strip() for e in filetypes.split(",") if e.strip())
                if ext_list:
                    types = [("Supported", " ".join(ext_list)), ("All files", "*.*")]

            result = filedialog.askopenfilename(
                title="Выберите файл",
                initialdir=initial or None,
                filetypes=types
            )
        else:
            result = filedialog.askdirectory(
                title="Выберите папку",
                initialdir=initial or None
            )
    except Exception as e:
        # Ничего не печатаем — просто пустой ответ
        print("", flush=True)
        sys.exit(0)

    print(result or "", flush=True)


if __name__ == "__main__":
    main()