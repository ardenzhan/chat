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
    let content = $('.messageInput').val()
    $('.messageInput').val('');
    
    socket.emit('chat message', content);

    newMessage({'user': name, 'content': content})

    event.preventDefault();
  });

  // EVENT LISTENERS
  socket.on('existing info', existing => {
    // existing users
    for (user of existing['users']) { newUser(user); }
  
    // existing messages
    $('.messages-list').append($('<div>').text('Will eventually be (click to show more)'))
    for (message of existing['messages']) { newMessage(message); }
  })

  socket.on('chat message', message => {
      newMessage(message);
  });

  socket.on('new user', user => {
      newUser(user);
      $('.messages-list').append($('<div>').text(`${user['name']} joined the chat :)`));
  });

  socket.on('disconnected user', socket_id => {
      let disconnected_name = document.getElementsByClassName(socket_id)[0].innerText;
      $(`.${socket_id}`).remove();
      $('.messages-list').append($('<div>').text(`${disconnected_name} left the chat :(`));
      updateOnlineCount();
  })

  // FUNCTIONS
  function newUser(user) {
    $('.users-list').append($('<div>').text(user.name).addClass(user.id));
    updateOnlineCount();
  }

  function newMessage(message) {
    $('.messages-list').append($('<div>').text(`${message['user']}: ${message['content']}`));
  }

  function updateOnlineCount() {
    let count = document.getElementsByClassName('users-list')[0].childElementCount;
    $('.online-count').text(count);
  }

})