$(() => {
  // const name = prompt('What is your name?').trim();
  const socket = io();
  var name = '';
  
  // WHAT TO DO WHEN CONNECT
  socket.on('connect', () => {
    socket.emit('new user');
  })
  // Initialize name and existing users+messages
  socket.on('existing info', existing => {
    name = existing['name'];
    newUser({'id': socket.id, 'name': name})
    updateOnlineCount();
    for (user of existing['users']) { newUser(user); }
    for (message of existing['messages']) { newMessage(message); }
    scrollDown();
  })

  
  // SUBMIT NEW MESSAGE
  $('form').submit(event => {
    let content = $('.messageInput').val()
    
    socket.emit('chat message', content);

    newMessage({'user': name, 'content': content});
    scrollDown();
    $('.messageInput').val('');
    socket.emit('stopped typing');
    
    typing = false;
    clearTimeout(timeout);

    event.preventDefault();
  });

  // TYPING STATUS
  var typing = false;
  var timeout = undefined;
  const typing_wait_time = 2000;
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
    }, typing_wait_time);
  }

  // EVENT LISTENERS
  

  socket.on('started typing', name => {
    startedTyping(name);
  })

  socket.on('stopped typing', name => {
    stoppedTyping(name);
  })

  socket.on('chat message', message => {
    // new chat message means that user also stopped typing
    stoppedTyping(message['user']);
    newMessage(message);
    scrollDown();
  });

  socket.on('new user', user => {
    newUser(user);
    newMessage({'content': `${user['name']} joined`});
    scrollDown();
  });

  socket.on('disconnected user', socket_id => {
    let disconnected_name = document.getElementsByClassName(socket_id)[0].textContent;
    $(`.${socket_id}`).remove();
    newMessage({'content': `${disconnected_name} left`});
    scrollDown();
    updateOnlineCount();
  })

  // FUNCTIONS
  function newUser(user) {
    $('.users-list').append($('<div>').text(user.name).addClass(user.id));
    updateOnlineCount();
  }

  function newMessage(message) {
    // if message only has content and no user, then it's a system message
    let message_container = document.createElement('div');
    let content = document.createElement('span');
    content.textContent = message['content'];

    if ('user' in message) {
      let name = document.createElement('span');
      name.className = 'font-weight-bold';
      name.textContent = message['user'] + ' ';
      message_container.appendChild(name);

      content.className = 'font-weight-light';
    }
    else {
      message_container.className = 'text-center text-muted';
    }
    message_container.appendChild(content);

    document.getElementsByClassName('messages-list')[0].appendChild(message_container);
  }

  function scrollDown() {
    var element = document.getElementsByClassName('messages-list')[0];
    element.scrollTop = element.scrollHeight;
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