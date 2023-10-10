const querystring = require('querystring');
const request = require('request-promise');

const client_id = process.env.SPOTIPY_CLIENT_ID;
const client_secret = process.env.SPOTIPY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIPY_REDIRECT_URI;
const stateKey = 'spotify_auth_state';

const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const login = (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    const scope = 'user-read-private user-read-email user-top-read playlist-modify-public';
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
};

const callback = async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        return res.redirect('/#' +
        querystring.stringify({
            error: 'state_mismatch'
        }));
    }
    
    res.clearCookie(stateKey);
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };

    try {
        const body = await request.post(authOptions);
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;

        const options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
        };

        const userData = await request.get(options);

        res.redirect('/#' +
        querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
        }));

        console.log("\x1b[32m%s\x1b[0m", "Login Successful");


    } catch (error) {
        console.error(error);
        res.redirect('/#' +
        querystring.stringify({
            error: 'invalid_token'
        }));
    }
};

const refreshToken = async (req, res) => {
    const refresh_token = req.query.refresh_token;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    try {
        const body = await request.post(authOptions);
        const access_token = body.access_token;
        res.send({
            'access_token': access_token
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'internal_server_error' });
    }
};

module.exports = { login, callback, refreshToken };
