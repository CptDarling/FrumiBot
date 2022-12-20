const https = require('https');
const token = require('./token.json');
const client = require('./client.json');
const { resolve } = require('path');

var options = {
    hostname: 'api.twitch.tv',
    port: 443,
    path: '/helix/clips?broadcaster_id=',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + token.access_token,
        'Client-Id': client.CLIENT_ID,
    }
};

exports.refreshData = function (broadcaster_id) {
    // console.log('Clip listing');
    // console.log(options);

    return new Promise((resolve, reject) => {
        options.path += broadcaster_id;
        // console.log(options);

        const req = https.request(options, (res) => {
            // console.log('statusCode:', res.statusCode);
            // console.log('headers:', res.headers);

            res.on('data', (d) => {
                process.stdout.write(d);
                resolve('Data written');
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.end();

    });

}