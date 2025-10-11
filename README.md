# Proyecto NASA API

Este proyecto es una aplicación web que se comunica con la API de la NASA para mostrar contenido relacionado con el espacio, como la Imagen Astronómica del Día (APOD) y otros posts.

## Creador

Este proyecto fue desarrollado por **Iñaki Sobera Sotomayor**.

## Tecnologías Utilizadas

El proyecto utiliza las siguientes tecnologías:

*   **Backend:**
    *   Python
    *   Flask (microframework web)
    *   `requests` (para realizar peticiones HTTP a la API de la NASA)

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript
    *   GSAP (GreenSock Animation Platform) para animaciones.
    *   OGL (para el efecto de fondo animado DarkVeil en la página de inicio).
    *   StaggeredMenu (componente de menú interactivo).
    *   ElectricBorder (componente para efectos de borde eléctrico).
    *   BlurText (componente personalizado para animaciones de texto).

## Cómo Ejecutar el Proyecto

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local:

### 1. Clona el Repositorio

```bash
git clone https://github.com/nanisadw3/Nasa.git
cd Nasa
```

### 2. Crea y Activa un Entorno Virtual

Es una buena práctica usar un entorno virtual para gestionar las dependencias del proyecto.

```bash
python3 -m venv venv
source venv/bin/activate  # En Linux/macOS
# venv\Scripts\activate   # En Windows
```

### 3. Instala las Dependencias

```bash
pip install Flask requests
```

### 4. Configura tu Clave de API de la NASA

Para obtener datos de la API de la NASA, necesitarás una clave de API. Puedes obtener una clave gratuita en el [sitio web de la NASA API](https://api.nasa.gov/).

Una vez que tengas tu clave, puedes establecerla como una variable de entorno o modificar directamente el archivo `app.py` (aunque se recomienda la variable de entorno para mayor seguridad):

**Opción 1: Variable de Entorno (Recomendado)**

```bash
export NASA_API_KEY="TU_CLAVE_DE_API_AQUI"
```

**Opción 2: Modificar `app.py` (No recomendado para producción)**

Busca la línea donde se define `NASA_API_KEY` y reemplaza `"YOUR_API_KEY"` con tu clave real.

### 5. Ejecuta la Aplicación Flask

```bash
flask run
```

### 6. Accede a la Aplicación

Una vez que la aplicación esté en ejecución, ábrela en tu navegador web. Generalmente estará disponible en:

```
http://127.0.0.1:5000/
```

¡Disfruta explorando el cosmos con la API de la NASA!