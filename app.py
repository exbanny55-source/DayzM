from flask import Flask, render_template, url_for
from init_settings import load_settings, sync_settings

app = Flask(__name__)


def resolve_background(settings: dict) -> str:
    """URL для фона: локальный через static или внешний как есть."""
    bg = settings.get("background", {})
    source = bg.get("source", "")
    bg_type = bg.get("type", "url")

    if bg_type == "local":
        return url_for("static", filename=source)
    return source


@app.route("/")
def index():
    settings = load_settings()
    background_url = resolve_background(settings)
    frame = settings.get("frame", {})
    bg_anim = settings.get("background", {}).get("animation", {})
    zoom = bg_anim.get("zoom", {"from": 1.0, "to": 1.4})

    return render_template(
        "index.html",
        background_url=background_url,
        frame=frame,
        bg_anim=bg_anim,
        zoom=zoom
    )


if __name__ == "__main__":
    sync_settings()   # создаёт/дополняет settings.json при старте
    app.run(debug=True, host="0.0.0.0", port=5000)