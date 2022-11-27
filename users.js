const https = require('https');
const token = require('./token.json');
const client = require('./client.json');

exports.getUser = function (login) {
    return new Promise((resolve, reject) => {

        const endpoint = `https://api.twitch.tv/helix/users?login=${login}`;
        var { access_token, expires_in, token_type } = token;

        //token_type first letter must be uppercase    
        token_type =
            token_type.substring(0, 1).toUpperCase() +
            token_type.substring(1, token_type.length);

        var authorization = `${token_type} ${access_token}`;

        let headers = {
            authorization,
            "Client-Id": client.CLIENT_ID,
        };

        fetch(endpoint, { headers })
            .then((res) => res.json())
            .then((obj) => resolve(obj.data[0]));
    });
}