import whisper
import sys
import os

archivo = sys.argv[1]

modelo = whisper.load_model("base", device="cuda")
# Intentamos realizar la transcripción del archivo de audio
try:
    resultado = modelo.transcribe(archivo, language="es", task="transcribe")
    # Mostramos el texto resultante de la transcripción
    print("Texto transcrito:")
    print(resultado["text"].encode("utf-8").decode("utf-8"))
except Exception as e:
    print(f"Hubo un error al transcribir el archivo: {e}")
