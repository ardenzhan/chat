$(() => {
  var name = prompt('What is your name?').trim();
  var socket = io.connect();
  
  // WHAT TO DO WHEN CONNECT
  socket.on('connect', () => {
    socket.emit('new user', name);
    newUser({'id': socket.id, 'name': name})
    updateOnlineCount();
  })

  // SUBMIT NEW MESSAGE
  $('form').submit((event) => {
    let message = {
      user: name,
      content: $('.messageInput').val()
    };
    socket.emit('chat message', message);
    newMessage(message)
    $('.messageInput').val('');

    event.preventDefault();
  });

  // EVENT LISTENERS
  socket.on('existing_users', (users) => {
      for (user of users) { newUser(user); }
  });

  socket.on('existing_messages', messages => {
      for (message of messages) { newMessage(message); }
      $('.messages-list').append($('<li>').text('^ Previous 10 Messages ^'));
  });

  socket.on('chat message', message => {
      newMessage(message);
  });

  socket.on('new_user', user => {
      newUser(user);
  });

  socket.on('disconnected_user', (socket_id) => {
      let disconnected_name = document.getElementsByClassName(socket_id)[0].innerText;
      $(`.${socket_id}`).remove();
      $('.messages-list').append($('<li>').text(`${disconnected_name} left the chat :(`));
      updateOnlineCount();
  })

  // FUNCTIONS
  function newUser(user) {
    $('.users-list').append($('<li>').text(user.name).addClass(user.id));
    updateOnlineCount();
  }

  function newMessage(message) {
    $('.messages-list').append($('<li>').text(`${message['user']}: ${message['content']}`));
  }

  function updateOnlineCount() {
    let count = document.getElementsByClassName('users-list')[0].childElementCount;
    $('.online-count').text(count);
  }

})