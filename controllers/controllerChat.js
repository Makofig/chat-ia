import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";    
import {exec} from "child_process";
import respondAudio from "../middlewares/respondAudio.js"; // Importar la función respondAudio
import util from 'util'; // Importar util para promisificar exec
import Stream from "stream";
import { type } from "os";

function esConsultaClima(texto){
    const patrones = [
        /clima\s+(en|de)\s+\w+/i,
        /qué\s+temperatura\s+(hay|hace)/i,
        /cómo\s+está\s+el\s+tiempo/i,
        /llueve\s+en\s+\w+/i
    ];
    return patrones.some(regex => regex.test(texto));
}

function extraerCiudad(texto) {
    const match = texto.match(/(?:clima|tiempo|llueve|temperatura)\s+(en|de)\s+(\w+)/i);
    return match?.[2] ?? 'Resistencia'; // default
}

const execPromise = util.promisify(exec); 

dotenv.config(); // Cargar las variables de entorno desde el archivo .env   
/*
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // Cambia esto a la URL base de OpenRouter
    apiKey: process.env.OPENAI_API_KEY, 
}); 
*/
// URL del modelo local o remoto
const modelLocal = process.env.IA_URL || "http://localhost:11434/api/chat";  

const textToChat = async (req, res) => {
    try {
        // Obtener el mensaje o la transcripción
        const { query } = req.body; // Transcripción del audio (query)
        const { messageHistory = []} = req.body; // Mensaje del formulario (messageHistory)

        const mensajesConNoThink = messageHistory.map(msg => {
            if (msg.role === 'user') {
                return {
                    ...msg,
                    content: msg.content?.endsWith("/no_think") ? msg.content : msg.content + " /no_think"
                };
            }
            return msg;
        });
        // const { formDataObject } = req.body; // Contenido del formulario 
        //const message = formDataObject ? formDataObject.message : null; // Si existe formDataObject, obtener el mensaje
        // Verificar que solo se reciba uno de los dos
        /*
        if ((!query && !message) || (query && message)) {
            return res.status(400).json({ error: "Debe enviar solo uno de los dos: el mensaje o la transcripción del audio" });
        }
        */
        if (!query && messageHistory.length === 0) {
            return res.status(400).json({ error: "Debe enviar un mensaje o un historial de conversación." });
        }
        // Validar longitud del último mensaje del usuario
        const lastMessage = query || messageHistory.at(-1)?.content;
        if (!lastMessage || lastMessage.length > 1000) {
            return res.status(400).json({ error: "El mensaje no puede tener más de 1000 caracteres." });
        }

        const contextoPath = path.join("uploads", "contexto.txt");
        let contextoSeguro = "Contestar en español"; 

        if (fs.existsSync(contextoPath)) {
            const contexto = fs.readFileSync(contextoPath, "utf8").trim();
            if (contexto !== "") {
                const contextoLimit = contexto.slice(0, 3000).replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').replace(/\*/g, '').trim();
                contextoSeguro = `Contestar en español, con un tono de voz neutral. ${contextoLimit}`;
            }
        }
        
        // Verificar si el mensaje tiene más de 1000 caracteres
        /*
        const userMessage = query || message ;
        if (userMessage.length > 1000) {
            return res.status(400).json({ error: "El mensaje no puede tener más de 1000 caracteres" });
        }
        */
        console.log(mensajesConNoThink)
        // Construcción de mensajes: prompt system + historial (+ query si hay)
        const messagePromt = [
            { role: 'system', content: contextoSeguro },
            ...mensajesConNoThink,
            ...(query ? [{ role: 'user', content: query + "/no_think" }] : [])
        ];
        /*
        const prompt = "Contestar en español, con un tono de voz neutral" + contextoSeguro;
        let promptMessage = userMessage + "/no_think";
        const messagePromt = [
            { role: 'system', content: prompt },
            ...(message || [])
        ]
        */
        //.concat({ role: 'user', content: promptMessage });
        // Llamar a al modelo desde http://localhost:11434/api/chat
        const respuestaIA  = await fetch(`${modelLocal}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen3:30b', // o mistral 
                messages: messagePromt,
                options: {
                    "repeat_penalty": 1,
                    "stop": [
                        "<|im_start|>",
                        "<|im_end|>"
                    ],
                    "temperature": 0.7,
                    "top_k": 20,
                    "top_p": 0.95
                },
                stream: false, 
                tools: [
                    {
                        type: 'mcp', 
                        mcp_url: 'http://localhost:5010', 
                        function_name: 'fetch-weather' 
                    }
                ]
            })
        }); 
        
        if (!respuestaIA.ok) {
            const errorText = await respuestaIA.text();
            throw new Error(`Error del modelo: ${respuestaIA.status} - ${errorText}`);
        }

        const raw = await respuestaIA.text(); 
        console.log("Respuesta cruda de OpenAI:", raw); // Log the raw response from OpenAI
        let data; 
        try{
            data = JSON.parse(raw); 
        } catch (e) {
            throw new Error("Respuesta no es JSON válido. Contenido:\n" + raw);
        }
        //const response = completion.choices[0].message.content;
        const response = data.message.content; 

        if (!response || response.trim() === '') {
            console.log("El contenido está vacío, no se puede generar el audio.");
            return res.status(400).json({ error: "Respuesta vacía del modelo. No se puede generar el audio." });
        }
        console.log("Respuesta de OpenAI:", response); // Log the response from OpenAI

        const textoSeguro = response
            .replace(/<[^>]*>/g, '') // elimina etiquetas como <think>
            .replace(/[^\x00-\x7F]/g, '') // elimina emojis y caracteres no ASCII
            .replace(/\s+/g, ' ') // normaliza espacios
            .trim();

        // const audioGenerado = await respondAudio(textoSeguro); 
      
        // Aquí puedes agregar la lógica para procesar el mensaje y generar una respuesta
        //const response = `${message}`;
        res.status(200).json({
            respuesta: response,
            //audio: audioGenerado // Enviar el audio generado como respuesta
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
   
    const rutaAudio = path.resolve(archivo.path); // Ruta del archivo subido
    console.log("Ruta del archivo de audio:", rutaAudio); // Log the audio file path
    const rutaFinal = rutaAudio + ".wav"; // Ruta del archivo de audio final

    // Renombrar a .wav
    fs.renameSync(rutaAudio, rutaFinal); // Renombrar el archivo a .wav
    console.log("✅ Audio grabado en", rutaFinal);
    // Ejecutar Python con Whisper 
    try {
        const { stdout, stderr } = await execPromise(`python transcribir.py "${rutaFinal}"`, { encoding: 'UTF-8' });
        /*
        if (stderr) {
            console.error(`Error en el script de Python: ${stderr}`);
            return res.status(500).json({ error: "Error en el procesamiento del audio" });
        }
        */
        if (stderr) {
            console.warn("⚠️ Advertencia desde Python:", stderr);
            // No retornamos aún: puede ser solo un warning, seguimos
        }
        const textoTranscrito = Buffer.from(stdout, 'UTF-8').toString().trim(); // Convertir el buffer a string
        const soloTexto = textoTranscrito.replace(/^.*\r?\n/, '');

        // esta parte es la generacion de audio lo deberiamos agregar a la funcion respondAudio
        if(soloTexto === ""){
            return res.status(400).json({ 
                error: "La transcripción del audio está vacía. Por favor, asegurate de que el audio tenga contenido claro." 
            });
        } 
        //const audioGenerado = await respondAudio(soloTexto); // Llamar a la función para responder con el audio
        res.status(200).json({ 
            respuesta: soloTexto, 
            //audio: audioGenerado // Enviar el audio generado como respuesta 
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