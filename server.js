const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 存储房间信息
const rooms = {};

// 处理连接
io.on('connection', (socket) => {
  console.log('A user connected');

  // 创建房间
  socket.on('createRoom', (roomName) => {
    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push(socket.id);
    socket.join(roomName);
    io.to(roomName).emit('roomCreated', roomName);
    console.log(`Room "${roomName}" created`);
  });

  // 处理消息
  socket.on('sendMessage', (data) => {
    const { room, message } = data;
    io.to(room).emit('messageReceived', message);
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // 清理房间信息
    Object.keys(rooms).forEach((roomName) => {
      rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
        console.log(`Room "${roomName}" deleted`);
      }
    });
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
