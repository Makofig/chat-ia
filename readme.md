# 🤖 Chat-IA

Un chat inteligente que se comunica con un modelo LLM local para responder preguntas en tiempo real, vía texto o voz. Además, permite analizar documentos PDF para realizar consultas sobre su contenido.

## 🛠️ Tecnologías utilizadas

- **Node.js**  
- **Express.js**
- **JavaScript**
- **HTML + CSS**
- **Python (para transcripción de audio con Whisper)**

## ⚙️ Configuración

Antes de ejecutar el proyecto, debés configurar las siguientes variables de entorno:

```bash
MODEL_URL=http://localhost:11434/api/chat
MODEL_NAME=qwen3:30b
```
Asegurate de que el modelo LLM esté corriendo localmente en esa URL antes de iniciar la app.

## 🔑 Funcionalidades

💬 Chat por texto: interactuá con el modelo como si fuera una conversación normal.

🎤 Entrada por voz: grabá tu pregunta por micrófono, el sistema la transcribe y responde.

📄 Análisis de PDF: subí un archivo PDF y hacé preguntas sobre su contenido.

🧠 Contexto persistente: las conversaciones pueden mantener un historial para que el modelo recuerde.

🧰 Formato de respuestas mejorado: el código es resaltado, las respuestas son limpias y legibles.

## ▶️ Instalación y ejecución
1. Clonar el repositorio
```
git clone https://github.com/Makofig/chat-ia.git
cd chat-ia
```
2. Instalar dependencias Node.js
```
npm install
```
3. Instalar dependencias de Python
```
pip install -r requirements.txt
```
4. Iniciar la aplicación
```
npm start
```

## 🧪 Requisitos adicionales

Whisper debe estar instalado correctamente para procesar audio.
El modelo debe estar disponible en la URL especificada (ej. Ollama, LM Studio, etc).

## Author 
Desarrollado por Aquino Marcos [Makofig] — Proyecto en evolución constante 🚀

## 📄 Licencia
Este proyecto está licenciado bajo la Licencia Apache 2.0.