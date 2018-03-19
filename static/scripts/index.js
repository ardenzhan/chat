const socket = io()

socket.on('connect', () => {
  socket.emit('new user');
  socket.name = '';
  newUser({'id': socket.id, 'name': ''});
})

socket.on('initialize info', info => {
  updateNames(info['name']);
  for (user of info['users']) { newUser(user); }
  for (message of info['messages']) { newMessage(message); }
  scrollDown();
})

// Update socket name, user list name, and labelnames
function updateNames(updatedName) {
  socket.name = updatedName;

  document.getElementsByClassName(`${socket.id}`)[0].textContent = updatedName;

  let names = document.getElementsByClassName('labelname');
  for (let i = names.length - 1; i >= 0; i--){
    names[i].textContent = updatedName;
  }
};

// SUBMIT NEW USERNAME
document.getElementsByClassName('username-form')[0].onsubmit = event => {
  let nameInput = document.getElementsByClassName('nameInput')[0];
  let newName = nameInput.value.trim();
  nameInput.value = '';
  
  socket.emit('check name', newName);
  event.preventDefault();
}

socket.on('checked name', data => {
  let alert = document.getElementsByClassName('alert-message')[0];
  alert.innerHTML = ''; 

  let name = document.createElement('span');
  name.className = 'font-weight-bold';
  name.textContent = data.name;
  alert.appendChild(name);

  let message = document.createElement('span');

  if (data.exist) {
    message.textContent = ' already exists, please try another name.';
    alert.appendChild(message);
  }
  else {
    updateNames(data.name);

    message.textContent = ' is your new name!';
    alert.appendChild(message);
  }
});

// SUBMIT NEW MESSAGE
document.getElementsByClassName('message-form')[0].onsubmit = event => {
  let messageInput = document.getElementsByClassName('messageInput')[0];
  let content = messageInput.value.trim();
  
  socket.emit('chat message', content);

  newMessage({'user': socket.name, 'content': content});
  scrollDown();

  messageInput.value = '';
  socket.emit('stopped typing');
  
  typing = false;
  clearTimeout(timeout);

  event.preventDefault();
};

// TYPING STATUS
var usersTyping = [];
var typing = false;
var timeout = undefined;
const typing_wait_time = 3000;

document.getElementsByClassName('messageInput')[0].oninput = () => {
  if (!typing) {
    typing = true;
    socket.emit('started typing');
  }
  else { clearTimeout(timeout); }

  timeout = setTimeout(() => {
    typing = false;
    socket.emit('stopped typing');
  }, typing_wait_time);
};

// EVENT LISTENERS
socket.on('started typing', name => {
  startedTyping(name);
});

socket.on('stopped typing', name => {
  stoppedTyping(name);
});

socket.on('chat message', message => {
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
  typing.innerHTML = '';

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
  document.getElementsByClassName('online-count')[0].textContent = count;
}