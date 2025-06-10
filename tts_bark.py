from transformers import AutoProcessor, BarkModel
import scipy
import torch
import numpy as np
import sys 
import re 
import scipy.io.wavfile as wavfile 
from IPython.display import Audio # type: ignore
import os
os.environ["SUNO_OFFLOAD_CPU"] = "True"
os.environ["SUNO_USE_SMALL_MODELS"] = "True"

# Controlar que la carpeta output exista 
# import os
# os.makedirs("output", exist_ok=True)

# ✅ Limpiar texto de etiquetas y caracteres problemáticos
def limpiar_texto(texto):
    texto = re.sub(r'<[^>]+>', '', texto)  # eliminar etiquetas HTML/Markdown
    texto = re.sub(r'[^\x00-\x7F]+', '', texto)  # eliminar caracteres no ASCII
    return texto.strip()

# ✅ Verificamos si hay texto pasado como argumento
if len(sys.argv) < 2 or not sys.argv[1].strip():
    print("Error: Se debe proporcionar un texto válido para generar el audio.")
    sys.exit(1)

texto = limpiar_texto(sys.argv[1])

# ✅ Cargar modelo y procesador de Hugging Face
print("Cargando modelo y procesador...")
print(torch.cuda.get_device_name(0))
processor = AutoProcessor.from_pretrained("suno/bark")
model = BarkModel.from_pretrained("suno/bark")

# ✅ Usar GPU si está disponible
# device = "cuda" if torch.cuda.is_available() else "cpu"
device = "cpu"
model = model.to(device)

# ✅ Forzar los submodelos a CUDA también
# model.semantic.to(device)

# ✅ Seleccionar voz (podés cambiar por otra de https://github.com/suno-ai/bark/blob/main/docs/README.md#voice-presets)
voice_preset = "v2/es_speaker_4"
# voice_preset = "v2/es_speaker_0"  # Cambiado a español

# Texto a convertir
# text = "Hola, ¿cómo estás? Este es un ejemplo de síntesis de voz con Bark."

# ✅ Preprocesar entrada y mover a GPU 
inputs = processor(texto, voice_preset=voice_preset)

# 💡 Mover cada tensor a GPU si es necesario

# inputs = {
#    k: (v.to(device) if isinstance(v, torch.Tensor) else v)
#    for k, v in inputs.items()
# }
# Mover tensores a GPU
# inputs = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}

# inputs = {k: v.to(device) if torch.is_tensor(v) else v for k, v in inputs.items()}

# Generar audio (esto puede tardar un poco)
# audio_array = model.generate(**inputs)
# audio_array = audio_array.cpu().numpy().squeeze()

# ✅ Generar audio
print("Generando audio...")
with torch.no_grad():
    audio_array = model.generate(**inputs)

# ✅ Convertir y guardar como WAV
audio_array = audio_array.cpu().numpy().squeeze()
sample_rate = model.generation_config.sample_rate

ruta_salida = "./output/respuesta.wav"

wavfile.write(ruta_salida, rate=sample_rate, data=audio_array)

# play text in notebook
Audio(audio_array, rate=sample_rate)

print(f"Audio generado exitosamente en: {ruta_salida}")
# Guardar como WAV
# sample_rate = model.generation_config.sample_rate
# scipy.io.wavfile.write("bark_out.wav", rate=sample_rate, data=audio_array)

# print("✅ Audio generado y guardado como bark_out.wav")
