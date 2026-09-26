from flask import Flask
from routes import main_bp
from settings_manager import sync_settings
from paths_manager import sync_paths
from music_manager import refresh_cache

app = Flask(__name__)
app.register_blueprint(main_bp)


if __name__ == "__main__":
    sync_settings()
    sync_paths()
    refresh_cache()      # ← скан музыки при старте сервера
    app.run(debug=True, host="0.0.0.0", port=5000)