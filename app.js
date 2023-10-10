require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { login, callback, refreshToken } = require('./public/spotifyAuth');

const app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', login);
app.get('/callback', callback);
app.get('/refresh_token', refreshToken);

const PORT = 8888;
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
