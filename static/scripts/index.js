$(() => {
  const socket = io();
  var name = '';
  
  // WHAT TO DO WHEN CONNECT
  socket.on('connect', () => {
    socket.emit('new user');
  })
  // Initialize name and existing users+messages
  socket.on('existing info', existing => {
    name = existing['name'];
    updateMessageLabelName(name);
    newUser({'id': socket.id, 'name': name})
    updateOnlineCount();
    for (user of existing['users']) { newUser(user); }
    for (message of existing['messages']) { newMessage(message); }
    scrollDown();
  })

  function updateMessageLabelName(name) {
    // document.getElementsByClassName('labelname')[0].textContent = name;
    $('.labelname').text(name);
  }

  // SUBMIT NEW USERNAME
  var newName = ''
  $('.username-form').submit(event => {
    newName = $('.nameInput').val().trim();
    $('.nameInput').val('');
    socket.emit('if new name exist', newName);
    event.preventDefault();
  });

  socket.on('if new name exist', exist => {
    if (exist) {
      $('.alert-message').html(`<span class='font-weight-bold'>${newName}</span> already exists, please try another name`);
    }
    else {
      changeName(newName);
      $('.alert-message').html(`Your new name is now <span class='font-weight-bold'>${newName}</span>!`);
      socket.emit('updated name', newName);
    }
  });

  function changeName(newName){
    name = newName;
    updateMessageLabelName(name);
    $(`.${socket.id}`).text(name);
  }

  // SUBMIT NEW MESSAGE
  $('.message-form').submit(event => {
    let content = $('.messageInput').val();
    
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
  var usersTyping = [];
  var typing = false;
  var timeout = undefined;
  const typing_wait_time = 3000;
  
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

  socket.on('updated name', user => {
    let oldName = $(`.${user.id}`).text();
    newMessage({'content': `${oldName} changed name to ${user.name}`});
    $(`.${user.id}`).text(user.name);
  })

  socket.on('disconnected user', socket_id => {
    // remove from typing list, remove from online list, send system message
    let disconnected_name = document.getElementsByClassName(socket_id)[0].textContent;
    stoppedTyping(disconnected_name);
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

  function appendTyping() {
    let typing = document.getElementById('typing');
    typing.innerHTML = ''

    switch (usersTyping.length) {
      case 0:
        break;

      case 1:
        typing.appendChild(usersTyping[0]);
        typing.innerHTML += ' is typing...';
        break;

      case 2:
        typing.appendChild(usersTyping[0]);
        typing.innerHTML += ' and ';
        typing.appendChild(usersTyping[1]);
        typing.innerHTML += ' are typing...';
        break;
      
      case 3:
        typing.appendChild(usersTyping[0]);
        typing.innerHTML += ', '
        typing.appendChild(usersTyping[1]);
        typing.innerHTML += ', and ';
        typing.appendChild(usersTyping[2]);
        typing.innerHTML += ' are typing...';
        break;

      default:
        typing.innerHTML = 'Several users are typing...';
        break;
    }
  }

  function startedTyping(name) {
    let user = document.createElement('span');
    user.className = 'font-weight-bold';
    user.textContent = name;
    usersTyping.push(user);
    appendTyping();
  }

  function stoppedTyping(name) {
    let index = usersTyping.findIndex(user => user.textContent == name);
    if (index != -1) usersTyping.splice(index, 1);
    appendTyping();
  }

  function updateOnlineCount() {
    let count = document.getElementsByClassName('users-list')[0].childElementCount;
    $('.online-count').text(count);
  }

})