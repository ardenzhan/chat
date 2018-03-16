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

http.listen(port, () => console.log(`Listening on port ${port}`));

require('./server/config/socket')(io);