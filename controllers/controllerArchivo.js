import fs from 'fs';    
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

// Función para leer y extraer texto del PDF
async function leerPdfConPdf2json(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
        pdfParser.on('pdfParser_dataReady', pdfData => {
            if (!pdfData?.Pages?.length) {
                return reject(new Error('Estructura del PDF no válida o no contiene texto.'));
            }

            let textoExtraido = '';

            pdfData.Pages.forEach((page, i) => {
                const textoPagina = page.Texts.map(texto => {
                    return texto.R.map(r => decodeURIComponent(r.T)).join('');
                }).join(' ');
                textoExtraido += textoPagina + '\n';
            });

            console.log("✅ Texto extraído (truncado):\n", textoExtraido.slice(0, 300));
            resolve(textoExtraido);
        });

        pdfParser.loadPDF(filePath);
    });
}

function limpiarTextoExtraido(texto) {
  // 1. Unir letras separadas artificialmente (por espacios)
  texto = texto.replace(/(?:\b\w\s)+(?:\w\b)/g, (match) => match.replace(/\s/g, ''));

  // 2. Reemplazar múltiples espacios por uno solo
  texto = texto.replace(/\s{2,}/g, ' ');

  // 3. Arreglar saltos de línea innecesarios
  texto = texto.replace(/\n{2,}/g, '\n').trim();

  return texto;
}

export const analizarArchivo = async (req, res) => {
    try {
        const archivo = req.file; // Obtener el archivo subido
        if (!archivo) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }

        const filePath = path.join("uploads", archivo.filename); // Ruta del archivo subido
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        //const content = fs.readFileSync(filePath, 'utf-8'); // Leer el contenido del archivo

        const contenido = await leerPdfConPdf2json(filePath);
        const textoLimpio = limpiarTextoExtraido(contenido); 
        //const textoExtraido = contenido; 
        const txtPath = path.join("uploads", "contexto.txt"); 

        fs.writeFileSync(txtPath, textoLimpio, "utf-8" ); 

        res.status(200).json({ respond: contenido });
    } catch (error) {
        console.error("Error en analizarArchivo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};