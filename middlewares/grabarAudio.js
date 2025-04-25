import fs from 'fs';
import path from 'path';
import recoder from 'node-record-lpcm16';

const archivoSalida = path.resolve('audio.wav');
const grabacion = recoder.record({ 
    sampleRate: 16000,
    channels: 1,
    verbose: false,
    recordProgram: 'sox', // Utiliza el programa de grabación 'rec'
    bitDepth: 16,
    silence: 1.0, // Silencio de 5 segundos para detener la grabación
    thresholdStart: 0.5, // Umbral de inicio de grabación
    thresholdEnd: 0.5, // Umbral de finalización de grabación
});
const duracion = 5 // Duración de la grabación en segundos

console.log('Grabando audio...', duracion, 'segundos');
const archivo = fs.createWriteStream(archivoSalida, { encoding: 'binary' });

grabacion.stream().pipe(archivo);
grabacion.stream().on('error', (error) => {
    console.error('Error al grabar audio:', error);
});

setTimeout(() => {
    grabacion.stop();
    console.log('✅ Audio grabado en', archivoSalida);
}, duracion * 1000); // Convertir a milisegundos