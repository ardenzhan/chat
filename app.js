const express = require('express');
const app     = express();
const path    = require('path');
const http    = require('http').Server(app);
const io      = require('socket.io')(http, { wsEngine: 'ws' });
const port    = 3000;

app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => { res.render('index'); });

// LISTEN
http.listen(port, () => console.log(`Listening on port ${port}`));

// SOCKET 
var users = [];
var messages = [];

io.on('connection', socket => {
  console.log(`Connected client/socket ID: ${socket.id}`);

  socket.on('new user', name => {
    if (users.length > 0) socket.emit('existing_users', users);
    if (messages.length > 0) socket.emit('existing_messages', messages.slice(-10));

    var new_user = {'id': socket.id, 'name': name};

    users.push(new_user);

    socket.broadcast.emit('new_user', new_user);
  })


  socket.on('chat message', message => {
    messages.push(message);
    socket.broadcast.emit('chat message', message);
  })


  socket.on('disconnect', () => {
    // Remove disconnected user from users "database"
    var index = users.findIndex((user) => {
        return user.id == socket.id;
    });
    if (index != -1) users.splice(index, 1);
    
    // Broadcast to everyone else besides disconnected user
    socket.broadcast.emit('disconnected_user', socket.id);
    console.log(`Disconnected client/socket ID: ${socket.id}`);
  });

});

