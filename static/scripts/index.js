$(() => {
  const name = prompt('What is your name?').trim();
  const socket = io();
  
  // WHAT TO DO WHEN CONNECT
  socket.on('connect', () => {
    socket.emit('new user', name);
    newUser({'id': socket.id, 'name': name})
    updateOnlineCount();
  })

  // SUBMIT NEW MESSAGE
  $('form').submit(event => {
    let content = $('.messageInput').val()
    
    
    socket.emit('chat message', content);

    newMessage({'user': name, 'content': content})
    $('.messageInput').val('');
    socket.emit('stopped typing');
    
    typing = false;
    clearTimeout(timeout);

    event.preventDefault();
  });

  // TYPING STATUS
  var typing = false;
  var timeout = undefined;
  var usersTyping = [];
  $('.messageInput').on('input', () => {
    updateTyping();
  });
  function updateTyping() {
    if (!typing) {
      typing = true;
      socket.emit('started typing');
    }
    else { clearTimeout(timeout); }

    timeout = setTimeout(() => {
      typing = false;
      socket.emit('stopped typing');
    }, 3000);
  }

  // EVENT LISTENERS
  socket.on('started typing', name => {
    startedTyping(name);
  })

  socket.on('stopped typing', name => {
    stoppedTyping(name);
  })

  socket.on('existing info', existing => {
    // existing users
    for (user of existing['users']) { newUser(user); }
    // existing messages (max 10)
    for (message of existing['messages']) { newMessage(message); }
  })

  socket.on('chat message', message => {
    // new chat message means that user also stopped typing
    stoppedTyping(message['user']);
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


  function getUserTypingString() {
    let usersString = ''
    for (user of usersTyping) {
      usersString += `${user}, `;
    }
    usersString = usersString.slice(0, -2);
    return usersString;
  }

  function startedTyping(name) {
    usersTyping.push(name);
    $('.typing').text('Typing: ' + usersTyping.join(', '));
  }

  function stoppedTyping(name) {
    var index = usersTyping.indexOf(name);
    if (index != -1) usersTyping.splice(index, 1);

    if (usersTyping.length > 0) $('.typing').text('Typing: ' + usersTyping.join(', '));
    else $('.typing').text('');
  }

  function updateOnlineCount() {
    let count = document.getElementsByClassName('users-list')[0].childElementCount;
    $('.online-count').text(count);
  }

})