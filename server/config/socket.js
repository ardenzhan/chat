var foods = require('../../static/food-list').slice();
var users = [];
var messages = [];

function getRandomName() {
  if (!foods.length) foods = require('../../static/food-list').slice();
  let name = foods.splice(Math.floor(Math.random() * foods.length), 1)[0];
  
  if (checkNameExist(name)) {
    name = `${name} jr`;
  }

  return name;
}

function checkNameExist(name) {
  let index = users.findIndex(user => {
    return user.name == name;
  })
  if (index == -1) return false;
  else return true;
}

module.exports = io => {
  io.on('connection', socket => {
    let currentUser = {'id': socket.id, 'name': getRandomName()};
    console.log('New Socket Connection:', currentUser);
  
    socket.on('new user', () => {
  
      // emit existing users & last 30 messages back to socket
      let existing_info = {
        'name': currentUser['name'],
        'users': users,
        'messages': messages.slice(-30)
      }
      socket.emit('existing info', existing_info);
  
      // push currentUser into users after emitting existing users
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
  
  
    // socket.on('drawing', data => {
    //   socket.broadcast.emit('drawing', data);
    // })
  
    
    socket.on('disconnect', () => {
      console.log(`Disconnected client/socket ID: ${socket.id}`);
  
      // Remove disconnected user from users "database"
      let index = users.findIndex((user) => {
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
}