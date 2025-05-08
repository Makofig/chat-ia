import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";    
import {exec} from "child_process";
import respondAudio from "../middlewares/respondAudio.js"; // Importar la función respondAudio
import util from 'util'; // Importar util para promisificar exec
import Stream from "stream";

const execPromise = util.promisify(exec); // Promisificar exec para usar async/await
/*
async function respondAudio(textoSeguro) {
    return new Promise((resolve, reject) => {
        exec(`python tts.py "${textoSeguro}"`, { encoding: 'utf-8' }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error al generar el audio: ${error.message}`);
                return res.status(500).json({ error: "Error al procesar el audio" });
            }
            if (stderr) {
                console.error(`Error en el script de Python: ${stderr}`);
                return res.status(500).json({ error: "Error en el procesamiento del audio" });
            }
            
            fs.readFile("./output/respuesta.mp3", (err, audioData) => {
                if (err) {
                    console.error("Error al leer el archivo de audio:", err);
                    return res.status(500).json({ error: "Error al procesar el audio" });
                }
                // Convertir el audio a formato WAV
                const audioBase64  = audioData.toString('base64'); // Convertir el buffer a base64
                console.log("Audio generado correctamente");
                // Enviar el audio como respuesta
                resolve(audioBase64);
                
            });
        });
    });
}
*/
dotenv.config(); // Cargar las variables de entorno desde el archivo .env   
/*
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // Cambia esto a la URL base de OpenRouter
    apiKey: process.env.OPENAI_API_KEY, 
}); 
*/

const textToChat = async (req, res) => {
    try {
        //const { query } = req.body; // Obtener el mensaje del cuerpo de la solicitud
        //const { message } = req.body.formDataObject;
        // Obtener el mensaje o la transcripción
        const { query } = req.body; // Transcripción del audio (query)
        console.log("query:", query); // Log the query
        const { formDataObject } = req.body; // Contenido del formulario
        
        const message = formDataObject ? formDataObject.message : null; // Si existe formDataObject, obtener el mensaje
        // Verificar que solo se reciba uno de los dos
        if ((!query && !message) || (query && message)) {
            return res.status(400).json({ error: "Debe enviar solo uno de los dos: el mensaje o la transcripción del audio" });
        }
        // Verificar si el mensaje tiene más de 1000 caracteres
        const userMessage = query || message;
        if (userMessage.length > 1000) {
            return res.status(400).json({ error: "El mensaje no puede tener más de 1000 caracteres" });
        }
        /*
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", 
                "content": [{
                    "type": "text",
                    "text": userMessage,
                }] 
            }],
            model: "google/gemma-2-9b-it:free",
            tool_choice: "auto", 
            tools: [
                {
                    type: "mcp",
                    mcp_url: "http://localhost:5010",
                }
            ]       
        });*/
        const respuestaIA  = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                messages: [
                    { role: 'system', content: 'Sos un asistente útil y conciso.' },
                    { role: 'user', content: userMessage }
                ],
                stream: false 
            })
        }); 
        
        if (!respuestaIA.ok) {
            const errorText = await respuestaIA.text();
            throw new Error(`Error del modelo: ${respuestaIA.status} - ${errorText}`);
        }
        const raw = await respuestaIA.text(); // Leer como texto primero
        console.log("Respuesta cruda de Ollama:", raw); 

        let data; 
        try{
            data = JSON.parse(raw); 
        } catch (e) {
            throw new Error("Respuesta no es JSON válido. Contenido:\n" + raw);
        }
        //const response = completion.choices[0].message.content;
        const response = data.message.content; 
        console.log("Respuesta de OpenAI:", response); // Log the response from OpenAI
        const textoSeguro = response
            .replace(/[\r\n]+/g, ' ')  // Reemplaza saltos de línea por espacios
            .replace(/"/g, '\\"')      // Escapa comillas
            .replace(/\*/g, '')        // Elimina el carácter especial *
            .trim();    // Eliminar comillas dobles del texto
        const audioGenerado = await respondAudio(textoSeguro); 
      
        // Aquí puedes agregar la lógica para procesar el mensaje y generar una respuesta
        //const response = `${message}`;
        res.status(200).json({
            respuesta: response,
            audio: audioGenerado // Enviar el audio generado como respuesta
        }); // Enviar la respuesta como JSON
    } catch (error) {
        console.error("Error en textToChat:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}; 

const audioGrabar = async (req, res) => {
    const archivo = req.file; // Obtener el archivo subido
    if (!archivo) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    /*
    const filePath = path.join("uploads", archivo.filename); // Ruta del archivo subido
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    */
    // nombre fijo del archivo de audio
    // const nombreFijo = "audio.wav"; // Nombre fijo del archivo de audio
    // const rutaAudio = path.resolve("uploads", nombreFijo); // Ruta del archivo subido
    // fs.renameSync(archivo.path, rutaAudio); // Renombrar el archivo a .wav
    const rutaAudio = path.resolve(archivo.path); // Ruta del archivo subido
    console.log("Ruta del archivo de audio:", rutaAudio); // Log the audio file path
    const rutaFinal = rutaAudio + ".wav"; // Ruta del archivo de audio final

    // Renombrar a .wav
    fs.renameSync(rutaAudio, rutaFinal); // Renombrar el archivo a .wav
    console.log("✅ Audio grabado en", rutaFinal);
    // Ejecutar Python con Whisper 
    try {
        const { stdout, stderr } = await execPromise(`python transcribir.py "${rutaFinal}"`, { encoding: 'UTF-8' });
        if (stderr) {
            console.error(`Error en el script de Python: ${stderr}`);
            return res.status(500).json({ error: "Error en el procesamiento del audio" });
        }
       
        const textoTranscrito = Buffer.from(stdout, 'UTF-8').toString().trim(); // Convertir el buffer a string
        const soloTexto = textoTranscrito.replace(/^.*\r?\n/, '');

        // esta parte es la generacion de audio lo deberiamos agregar a la funcion respondAudio
        if(soloTexto === ""){
            return res.status(400).json({ 
                error: "La transcripción del audio está vacía. Por favor, asegurate de que el audio tenga contenido claro." 
            });
        } 
        const audioGenerado = await respondAudio(soloTexto); // Llamar a la función para responder con el audio
        res.status(200).json({ 
            respuesta: soloTexto, 
            audio: audioGenerado // Enviar el audio generado como respuesta 
        }); // Enviar la respuesta como JSON
    } catch (error) {
        console.error("❌ Error general:", error);
        return res.status(500).json({ error: "Error al procesar el audio" });
    }
    /*
    exec(`python transcribir.py "${rutaFinal}"`,{ encoding: 'utf-8'}, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script de Python: ${error.message}`);
            return res.status(500).json({ error: "Error al procesar el audio" });
        }
        if (stderr) {
            console.error(`Error en el script de Python: ${stderr}`);
            return res.status(500).json({ error: "Error en el procesamiento del audio" });
        }
        // Aquí puedes procesar la salida del script de Python
        //const textoTranscrito = stdout.trim(); // Eliminar espacios en blanco al principio y al final
        const textoTranscrito = Buffer.from(stdout, 'utf-8').toString().trim(); // Convertir el buffer a string
        console.log(`Texto transcrito: ${stdout}`); // 
        const soloTexto = textoTranscrito.replace(/^.*\r?\n/, '');
        try {
            const audioGenerado = await respondAudio(soloTexto); // Llamar a la función para responder con el audio
            res.status(200).json({ 
                respuesta: soloTexto, 
                audio: audioGenerado // Enviar el audio generado como respuesta 
            }); // Enviar la respuesta como JSON
        } catch (error) {
            console.error("Error al generar el audio:", error);
            res.status(500).json({ error: "Error al generar el audio" });
        }
        
    });
    */
};

export default {
    textToChat, 
    audioGrabar
};  