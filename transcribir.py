import whisper
import sys
from whisper.utils import get_writer
import io 
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
##def save_file(results, format='txt'): 
    ##writer = get_writer(format, './output/')
    ##writer(results, f'transcripcion.{format}')
def save_file(text, filename='transcripcion.txt'):
    with open(f'./output/{filename}', 'w', encoding='utf-8') as f:
        f.write(text)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
archivo = sys.argv[1]

modelo = whisper.load_model("base", device="cuda")
# Intentamos realizar la transcripción del archivo de audio
beam_size=5
best_of=5
temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)

decode_options = dict(language="es", best_of=best_of, beam_size=beam_size, temperature=temperature)
transcribe_options = dict(task="transcribe", **decode_options)
try:
    resultado = modelo.transcribe(archivo, **transcribe_options)
    # Mostramos el texto resultante de la transcripción
    print("Texto transcrito:")
    print(resultado["text"]) 
    # Guardamos el resultado en un archivo de texto
    save_file(resultado["text"])

except Exception as e:
    print(f"Hubo un error al transcribir el archivo: {e}")
