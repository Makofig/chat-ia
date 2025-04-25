import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";    
import {exec} from "child_process";

dotenv.config(); // Cargar las variables de entorno desde el archivo .env   

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // Cambia esto a la URL base de OpenRouter
    apiKey: process.env.OPENAI_API_KEY, 
}); 

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
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", 
                "content": [{
                    "type": "text",
                    "text": userMessage,
                }] 
            }],
            model: "google/gemma-2-9b-it:free",
        });
        
        const response = completion.choices[0].message.content;

        console.log("Respuesta de OpenAI:", response); // Log the response from OpenAI
        // Aquí puedes agregar la lógica para procesar el mensaje y generar una respuesta
        //const response = `${message}`;
        res.status(200).json({respuesta: response}); // Enviar la respuesta como JSON
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
    const rutaAudio = path.resolve(archivo.path); // Ruta del archivo subido
    console.log("Ruta del archivo de audio:", rutaAudio); // Log the audio file path
    const rutaFinal = rutaAudio + ".wav"; // Ruta del archivo de audio final

    // Renombrar a .wav
    fs.renameSync(rutaAudio, rutaFinal); // Renombrar el archivo a .wav
    console.log("✅ Audio grabado en", rutaFinal);
    // Ejecutar Python con Whisper 
    exec(`python transcribir.py "${rutaFinal}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script de Python: ${error.message}`);
            return res.status(500).json({ error: "Error al procesar el audio" });
        }
        if (stderr) {
            console.error(`Error en el script de Python: ${stderr}`);
            return res.status(500).json({ error: "Error en el procesamiento del audio" });
        }
        // Aquí puedes procesar la salida del script de Python
        const textoTranscrito = stdout.trim(); // Eliminar espacios en blanco al principio y al final
        console.log(`Texto transcrito: ${stdout}`); // 
        const soloTexto = textoTranscrito.replace(/^.*\r?\n/, '');
        res.status(200).json({ respuesta: soloTexto }); // Enviar la respuesta como JSON
    });
};

export default {
    textToChat, 
    audioGrabar
};  