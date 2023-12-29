require("dotenv").config({ path: "./.env" });

const https = require('https');
const fs = require('fs');
const { Console } = require('console');

exports.tokendata = require('../token.json');

const postData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: this.tokendata.refresh_token,
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
        'Content-Length': Buffer.byteLength(postData),
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

        res.setEncoding('utf8');

        res.on('data', chunk => {
            process.stdout.write(JSON.stringify(JSON.parse(chunk), null, 2));
            storeData(chunk, './token.json');
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.write(postData);
    req.end();
}

// TODO: Implement validate, it doesn't work for now.
function validate() {
    // console.log({
    //     "headers": {
    //         "Authorization": `${this.tokendata.token_type}: ${this.tokendata.access_token}`
    //     }
    // })
    fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            "headers": {
                "Authorization": `bearer ${tokendata.access_token}`
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {
            if (resp.status) {
                if (resp.status == 401) {
                    console.log('This token is invalid: ' + resp.message);
                    console.log(resp);
                    return;
                }
                // 'Unexpected output with a status?';
                return;
            }
            if (resp.client_id) {
                client_id = resp.client_id;
                // token is valid was was generated for that client_id
                console.log(`token is valid`);
                return;
            }
            // if got here unexpected output from twitch
        })
        .catch(err => {
            console.log(err);
            // 'An Error Occured loading token data';
        });
    // const req = https.request({
    //     hostname: 'id.twitch.tv',
    //     port: 443,
    //     path: '/oauth2/validate',
    //     method: 'GET',
    //     headers: {
    //         'Authorization': `${tokendata.token_type}: ${tokendata.access_token}`,
    //     }
    // }, res => {
    //     console.log(`statusCode: ${res.statusCode}`);
    // })

    // req.on('error', error => {
    //     console.error(error);
    // });

    // req.end();
}

for (let i = 0; i < process.argv.length; i++) {
    switch (process.argv[i]) {
        case 'refresh':
            this.refresh();
            break;

        case 'validate':
            validate();
            break;

        default:
            break;
    }
}