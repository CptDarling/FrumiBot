const https = require('https');
const fs = require('fs');
const { Console } = require('console');

exports.data = require('./token.json');

const postData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: this.data.refresh_token,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
}).toString();

const options = {
    hostname: 'id.twitch.tv',
    port: 443,
    path: '/oauth2/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
    }
};

const storeData = (data, path) => {
    try {
        data = JSON.parse(data.toString())
        fs.writeFileSync(path, JSON.stringify(data, null, 4));
    } catch (err) {
        console.error(err);
    }
}

exports.refresh = function () {

    const req = https.request(options, res => {
        // console.log(`statusCode: ${res.statusCode}`);

        res.on('data', d => {
            // process.stdout.write(d);
            storeData(d, './token.json');
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.write(postData);
    req.end();
}
