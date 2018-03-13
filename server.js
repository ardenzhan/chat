const express = require('express');
const app     = express();
const path    = require('path');
const http    = require('http').Server(app);
const io      = require('socket.io')(http, { wsEngine: 'ws' });
const port    = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => { res.render('index'); });
app.get('/draw', (req, res) => { res.render('draw'); });

// LISTEN
http.listen(port, () => console.log(`Listening on port ${port}`));

// SOCKET 

var users = [];
var messages = [];

io.on('connection', socket => {
  var currentUser = null;

  console.log(`Connected client/socket ID: ${socket.id}`);

  socket.on('new user', name => {
    // emit existing users & last 30 messages back to socket
    let existing_info = {
      'users': users,
      'messages': messages.slice(-30)
    }
    if (users.length > 0 || messages.length > 0){
      socket.emit('existing info', existing_info);
    }

    // push currentUser into users after emitting existing users
    currentUser = {'id': socket.id, 'name': name};
    users.push(currentUser);

    // broadcast to every other socket
    socket.broadcast.emit('new user', currentUser);
  })


  socket.on('chat message', content => {
    message = {'user': currentUser['name'], 'content': content}
    messages.push(message);
    socket.broadcast.emit('chat message', message);
    if (messages.length > 30) messages = messages.slice(-30);
  })


  socket.on('started typing', () => {
    socket.broadcast.emit('started typing', currentUser['name']);
  });
  socket.on('stopped typing', () => {
    socket.broadcast.emit('stopped typing', currentUser['name']);
  })


  socket.on('drawing', data => {
    socket.broadcast.emit('drawing', data);
  })

  
  socket.on('disconnect', () => {
    console.log(`Disconnected client/socket ID: ${socket.id}`);

    // Remove disconnected user from users "database"
    var index = users.findIndex((user) => {
        return user.id == socket.id;
    });
    if (index != -1) users.splice(index, 1);
    
    // Broadcast to everyone else besides disconnected user
    if (users.length > 0) socket.broadcast.emit('disconnected user', socket.id);
    else {
      console.log('\nNo more connections\n')
      messages = [];
    }
    
  });

});

