import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config(); // Cargar las variables de entorno desde el archivo .env   

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // Cambia esto a la URL base de OpenRouter
    apiKey: process.env.OPENAI_API_KEY, 
}); 

const textToChat = async (req, res) => {
    try {
        const { message } = req.body.formDataObject;
        // Verificar si el mensaje está vacío
        if (!message) {
            return res.status(400).json({ error: "El mensaje no puede estar vacío" });
        }
        // Verificar si el mensaje tiene más de 1000 caracteres
        if (message.length > 1000) {
            return res.status(400).json({ error: "El mensaje no puede tener más de 1000 caracteres" });
        }
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", 
                "content": [{
                    "type": "text",
                    "text": message,
                }] 
            }],
            model: "google/gemini-2.5-pro-exp-03-25:free",
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

export default {
    textToChat
};  