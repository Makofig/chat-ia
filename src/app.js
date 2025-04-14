import express from 'express';  
import cors from 'cors'; // Importar cors para permitir solicitudes de diferentes dominios
import router from '../routes/chat.js'; // Importar el router de chat.js
import routerUpload from '../routes/upload.js'; // Importar el router de upload.js

/* ruta absiluta */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/', router); // Usar el router importado 
app.use('/', routerUpload); // Usar el router importado
// Middleware para manejar las solicitudes a la ruta raíz

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Route absolute: ${__dirname}`);  
}); 