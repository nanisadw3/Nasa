import requests
from deep_translator import GoogleTranslator
from flask import Flask, render_template, jsonify
import time

import os

app = Flask(__name__)

# NOTA: La clave de API ahora se lee de una variable de entorno para mayor seguridad.
# Si no se encuentra, se usa la DEMO_KEY de la NASA.
API_KEY = os.environ.get("NASA_API_KEY", "DEMO_KEY")

# --- Caching System ---
api_cache = {
    "apod": {"data": None, "timestamp": 0},
    "posts": {"data": None, "timestamp": 0},
    "translations": {},  # Cache for translations
}
# La imagen del día se actualiza una vez al día, así que un caché de 22 horas es seguro.
APOD_CACHE_DURATION_SECONDS = 22 * 60 * 60
# Los posts aleatorios pueden cambiar más a menudo, 1 hora de caché es un buen balance.
POSTS_CACHE_DURATION_SECONDS = 60 * 60
# --- End Caching System ---


def translate_text(text, target_lang="es"):
    if not text:
        return ""
    # Revisa el caché de traducciones primero
    if text in api_cache["translations"]:
        return api_cache["translations"][text]

    try:
        translated_text = GoogleTranslator(source="auto", target=target_lang).translate(
            text
        )
        # Guarda la nueva traducción en el caché
        api_cache["translations"][text] = translated_text
        return translated_text
    except Exception:
        # Si la traducción falla, devuelve el texto original
        return text


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/apod")
def apod():
    cache_entry = api_cache["apod"]
    # Si hay datos en caché y no han expirado, los usamos
    if cache_entry["data"] and (
        time.time() - cache_entry["timestamp"] < APOD_CACHE_DURATION_SECONDS
    ):
        return render_template("apod.html", post=cache_entry["data"])

    # Si no, hacemos la petición a la API
    url = f"https://api.nasa.gov/planetary/apod?api_key={API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        post = {
            "title": translate_text(data.get("title", "Sin título")),
            "explanation": translate_text(data.get("explanation", "Sin explicación.")),
            "url": data.get("url"),
            "media_type": data.get("media_type"),
        }
        # Asegurarnos de que la URL no es None antes de reemplazar
        if (
            post.get("media_type") == "video"
            and post.get("url")
            and "youtube.com" in post["url"]
        ):
            post["url"] = post["url"].replace("watch?v=", "embed/")

        # Actualizamos el caché con los nuevos datos y la hora actual
        cache_entry["data"] = post
        cache_entry["timestamp"] = time.time()

        return render_template("apod.html", post=post)
    except requests.exceptions.RequestException as e:
        return f"<h1>Error</h1><p>Error al contactar la API de la NASA: {e}</p>"


@app.route("/posts")
def posts():
    cache_entry = api_cache["posts"]
    # Si hay datos en caché y no han expirado, los usamos
    if cache_entry["data"] and (
        time.time() - cache_entry["timestamp"] < POSTS_CACHE_DURATION_SECONDS
    ):
        return render_template("posts.html", posts=cache_entry["data"])

    posts_count = "5"
    url = f"https://api.nasa.gov/planetary/apod?api_key={API_KEY}&count={posts_count}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return render_template('posts.html', error=f"Error al contactar la API de la NASA: {e}")

    if isinstance(data, dict) and data.get("error"):
        return (
            f"<h1>Error de la API de la NASA</h1><p>{data['error']['message']}</p>"
        )

    dic = {}
    for i in data:
        if not i.get("title") or not i.get("url"):
            continue

        titulo_es = translate_text(i.get("title"))
        expl_es = translate_text(i.get("explanation", "No hay explicación disponible."))

        media_url = i.get("url")
        if i.get("media_type") == "video" and media_url and "youtube.com" in media_url:
            media_url = media_url.replace("watch?v=", "embed/")

        dic[titulo_es] = {"Explicacion": expl_es, "Link": media_url}

    # Actualizamos el caché
    cache_entry["data"] = dic
    cache_entry["timestamp"] = time.time()

    return render_template("posts.html", posts=dic)


@app.route("/api/posts")
def api_posts():
    posts_count = "5"
    url = f"https://api.nasa.gov/planetary/apod?api_key={API_KEY}&count={posts_count}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        respuesta = response.json()
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error al contactar la API de la NASA: {e}"}), 500

    if isinstance(respuesta, dict) and respuesta.get("error"):
        return jsonify({"error": respuesta["error"]["message"]}), 500

    posts_list = []
    for i in respuesta:
        if not i.get("title") or not i.get("url"):
            continue

        titulo_es = translate_text(i.get("title"))
        expl_es = translate_text(i.get("explanation", "No hay explicación disponible."))

        media_url = i.get("url")
        media_type = i.get("media_type")
        if media_type == "video" and media_url and "youtube.com" in media_url:
            media_url = media_url.replace("watch?v=", "embed/")

        posts_list.append(
            {
                "title": titulo_es,
                "explanation": expl_es,
                "url": media_url,
                "media_type": media_type,
            }
        )

    return jsonify(posts_list)


@app.route("/creador")
def creador():
    return render_template("creador.html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

