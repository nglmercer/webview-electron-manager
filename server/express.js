import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupExpressServer(electronWindow) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  app.use(cors());
  app.use(express.json());
  app.use(express.static(join(__dirname, '../public')));

  // Servir la interfaz web
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../public/web.html'));
  });

  // API para obtener lista de ventanas
  app.get('/api/windows', (req, res) => {
    const windowsList = Array.from(electronWindow.getWindows().entries()).map(([id, config]) => ({
      id,
      ...config
    }));
    res.json(windowsList);
  });

  // Socket.IO para actualizaciones en tiempo real
  io.on('connection', (socket) => {
    socket.on('create-window', (config) => {
      electronWindow.createWindow(config);
    });

    socket.on('update-window', ({ id, config }) => {
      electronWindow.updateWindow(id, config);
    });
    socket.emit('window-list', Array.from(electronWindow.getWindows().entries()).map(([id, config]) => ({id,...config})));
    socket.on('close-window', (id) => {
      electronWindow.closeWindow(id);
    });
  });

  // Eventos desde Electron hacia el navegador
  electronWindow.on('window-created', (data) => {
    io.emit('window-created', data);
  });

  electronWindow.on('window-closed', (id) => {
    io.emit('window-closed', id);
  });

  electronWindow.on('window-updated', (data) => {
    io.emit('window-updated', data);
    //io.emit('window-list', Array.from(electronWindow.getWindows().entries()).map(([id, config]) => ({id,...config})));
  });

  const PORT = 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}