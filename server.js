import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Password check route
app.get('/check-password', (req, res) => {
  const pw = req.query.pw;
  if(pw === process.env.HOST_PASSWORD) return res.json({valid:true, role:'host'});
  if(pw === process.env.VIEWER_PASSWORD) return res.json({valid:true, role:'viewer'});
  res.json({valid:false});
});

// Video state storage
let hostState = {
  url: '',
  playing: false,
  time: 0,
  quality: '720'
};

io.on('connection', socket => {
  console.log('a user connected');

  // Send current state to new users
  socket.emit('syncState', hostState);

  // Listen to host updates
  socket.on('hostUpdate', (data) => {
    hostState = {...hostState, ...data};
    socket.broadcast.emit('updateState', hostState);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
