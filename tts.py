from gtts import gTTS
from TTS.api import TTS
import sys 
import torch
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import XttsAudioConfig, XttsArgs
from TTS.config.shared_configs import BaseDatasetConfig, BaseAudioConfig

# Aceptar XttsConfig como argumento
torch.serialization.add_safe_globals([XttsConfig])
torch.serialization.add_safe_globals([XttsAudioConfig, XttsArgs])
torch.serialization.add_safe_globals([BaseDatasetConfig])

# Inicializar el modelo XTTS v2
modelo = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

# Si tienes GPU disponible, puedes mover el modelo a GPU
modelo.to("cuda")  # o "cpu" si no tienes GPU

# Texto que quieres sintetizar (lo pasamos como argumento al script)
texto = sys.argv[1]

# Ruta de un archivo de voz breve (WAV) para clonación de voz
ruta_clon = "./output/cloning_cristinini_2.wav"  # Cambia esto al path de tu archivo de voz

# Salida del archivo de audio generado
ruta_salida = "./output/respuesta.wav"

# Generar la voz clonada
modelo.tts_to_file(
    text=texto,
    file_path=ruta_salida,
    speaker_wav=ruta_clon,      # <--- Archivo de voz para clonar el timbre
    language="es"               # Forzar idioma español
)

print("Audio generado exitosamente en:", ruta_salida)
# texto = sys.argv[1]
# Get device
# device = "cuda" if torch.cuda.is_available() else "cpu"
# Listar los modelos disponibles
# print(TTS().list_models())
# tts_models/multilingual/multi-dataset/xtts_v2
# modelo = TTS(model_name="tts_models/es/css10/vits", progress_bar=False) 
# modelo = TTS(model_name="tts_models/es/css10/vits", progress_bar=False).to(device)
# modelo.to("cuda")
# modelo.tts_to_file(text=texto, file_path="./output/respuesta.mp3")
# print("Audio generado con Coqui TTS")
# tts = gTTS(text=texto, lang='es') 
# tts.save("./output/respuesta.wav")
# print("Audio generado con exito.")  