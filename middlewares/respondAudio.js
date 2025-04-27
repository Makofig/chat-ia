import fs from 'fs';
import { exec } from 'child_process';
import __dirname from '../rutaRaiz.js'; // Importar la ruta absoluta
import path from 'path';

async function respondAudio(textoSeguro) {
    return new Promise((resolve, reject) => {
        exec(`python tts.py "${textoSeguro}"`, { encoding: 'utf-8' }, (error, stdout, stderr) => {
            if (!textoSeguro || textoSeguro.trim() === "") {
                console.error("El texto para generar audio está vacío.");
                return reject("El texto está vacío. No se puede generar el audio.");
            }
        
            if (error) {
                console.error(`Error al generar el audio: ${error.message}`);
                return reject("Error al generar el audio");
            }
            if (stderr) {
                console.warn(`Advertencia del script de Python: ${stderr}`);
            }

            fs.readFile(path.join(__dirname, "/output/respuesta.wav"), (err, audioData) => {
                if (err) {
                    console.error("Error al leer el archivo de audio:", err);
                    return reject("Error al leer el audio generado");
                }

                const audioBase64 = audioData.toString('base64');
                console.log("Audio generado correctamente");
                resolve(audioBase64);
            });
        });
    });
}

export default respondAudio;