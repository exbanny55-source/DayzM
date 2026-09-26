"""
Точка входа приложения.
Здесь только: создание Flask-приложения, регистрация Blueprint'ов,
синхронизация настроек и запуск сервера.
"""

from flask import Flask
from routes import main_bp
from settings_manager import sync_settings

app = Flask(__name__)
app.register_blueprint(main_bp)


if __name__ == "__main__":
    sync_settings()   # создаёт/дополняет settings.json при старте
    app.run(debug=True, host="0.0.0.0", port=5000)