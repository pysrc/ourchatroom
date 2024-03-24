const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 存储房间信息, room: [socketid]
const rooms = {};

// 存用户信息
const users = {}

// 存在线用户信息
// room: [user]
const onlines = {}

// 存房间历史会话
const historys = {}

// 处理连接
io.on('connection', (socket) => {
  console.log('A user connected');

  // 创建房间
  socket.on('createRoom', (_data) => {
    var {room, user} = _data;
    users[socket.id] = _data;
    if (!rooms[room]) {
      rooms[room] = [];
      onlines[room] = []
      historys[room] = "";
    }
    rooms[room].push(socket.id);
    onlines[room].push(user);
    socket.join(room);
    io.to(room).emit('roomCreated', {user, users: onlines[room]});
    // 首次加入推送历史会话
    io.to(socket.id).emit("history", historys[room]);
    console.log(`Room "${room}" created`);
  });

  // 处理消息
  socket.on('sendMessage', (data) => {
    const { room, message } = data;
    historys[room] += message;
    io.to(room).emit('messageReceived', message);
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('User disconnected');
    var curu = users[socket.id];
    if (curu) {
      var { room, user } = users[socket.id];
      delete users[socket.id];
      // 删除在线用户
      onlines[room] = onlines[room].filter((_user) => _user !== user);
      if (onlines[room].length === 0) {
        delete onlines[room];
      }
      io.to(room).emit('userquit', {user, users: onlines[room]});
      // 清理房间信息
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (rooms[room].length === 0) {
        delete rooms[room];
        delete historys[room];
        console.log(`Room "${room}" deleted`);
      }
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
