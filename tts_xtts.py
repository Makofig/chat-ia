from TTS.api import TTS
import sys
import torch
import os
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import XttsAudioConfig, XttsArgs
from TTS.config.shared_configs import BaseDatasetConfig, BaseAudioConfig
import os 
import re 
# from transformers import AutoModelForCausalLM

# Limpiar texto de etiquetas y caracteres problemáticos
def limpiar_texto(texto):
    texto = re.sub(r'<[^>]+>', '', texto)  # eliminar etiquetas HTML/Markdown
    texto = re.sub(r'[^\x00-\x7F]+', '', texto)  # eliminar caracteres no ASCII
    return texto.strip()

# Aceptar XttsConfig como argumento
torch.serialization.add_safe_globals([XttsConfig])
torch.serialization.add_safe_globals([XttsAudioConfig, XttsArgs])
torch.serialization.add_safe_globals([BaseDatasetConfig])

# Comprobar si hay una GPU disponible
device = "cuda" if torch.cuda.is_available() else "cpu"

# Inicializar el modelo XTTS v2
modelo = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
# modelo = AutoModelForCausalLM.from_pretrained("tts_models/multilingual/multi-dataset/xtts_v2", trust_remote_code=True)
modelo.to(device)  # Mover el modelo a GPU si está disponible

# Verificar que el texto se haya pasado correctamente
if len(sys.argv) < 2 or not sys.argv[1].strip():
    print("Error: Se debe proporcionar un texto válido para generar el audio.")
    sys.exit(1)

# Obtener el texto pasado como argumento
texto = limpiar_texto(sys.argv[1])

# Ruta de un archivo de voz breve (WAV) para clonación de voz
ruta_clon = "./output/cloning_cristinini_2.wav"  # Cambia esto al path de tu archivo de voz

# Salida del archivo de audio generado
ruta_salida = "./output/respuesta.wav"

# Verificar si el archivo de voz para clonación existe
if not os.path.exists(ruta_clon):
    print(f"Error: El archivo de voz para clonación '{ruta_clon}' no existe.")
    sys.exit(1)

# Intentar generar el audio
try:
    modelo.tts_to_file(
        text=texto,
        file_path=ruta_salida,
        speaker_wav=ruta_clon,      # Archivo de voz para clonar el timbre
        language="es"               # Forzar idioma español
    )
    print(f"Audio generado exitosamente en: {ruta_salida}")
except Exception as e:
    print(f"Ocurrió un error al generar el audio: {e}")
    sys.exit(1)