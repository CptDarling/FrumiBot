require("dotenv").config({ path: "./.env" });

const { weatherRepord } = require('./jinsy.js');

function getWeather(location) {
    return new Promise((resolve, reject) => {

        // console.log(`location: ${location}`);
        const uri = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${process.env.OWM_API_KEY}`;
        console.log(uri);
        const req = new Request(uri);

        fetch(req)
            .then((res) => {
                if (!res.ok) {
                    console.log(`HTTP error: ${res.status}`);
                    return reject(res.status);
                    // throw new Error(`HTTP error: ${res.status}`);
                }
                return res.json();
            })
            .then((json) => {
                // console.log(`DATA: ${JSON.stringify(json, null, 2)}`);
                if (json) {
                    // console.log(`CODE: ${JSON.stringify(json['cod'], null, 2)}`);
                    switch (json['cod']) {
                        case 404:
                            return reject(`OWM Error ${json['message']}`);

                            break;

                        case 200:
                            var c = parseFloat(json['main']['temp']);
                            var resp = {
                                celcius: parseFloat(c.toFixed(1)),
                                fahrenheit: parseFloat((c * 1.8 + 32).toFixed(1)),
                                humidity: parseFloat(json['main']['humidity']),
                                city: json['name'],
                                country: json['sys']['country'],
                                description: json['weather'][0]['description'],
                                visibility: parseFloat(parseFloat(json['visibility'] / 1000.0).toFixed(1)),
                                weatherid: json.weather[0].id,
                                jinsy: weatherRepord(json),
                            }
                            // console.log(`RESP: ${JSON.stringify(resp, null, 2)}`);
                            return resolve(resp);

                            break;

                        default:
                            break;
                    }
                }
            })
            .catch((e) => console.error(e));
    })
}

function testWeather() {
    ([
        'lutterworth',
        'Wrocław',
        // 'miami',
        // 'moon',
        // 'warsaw',
        // 'Ammanford',
        // 'thisplacedoesnotexist',
        // 'moscow',
        // 'Argentina',
        // 'Japan',
        // 'mcmurdo',
        // 'lahore',
        // 'bangladesh',
    ]).forEach(element => {
        getWeather(element)
        .then(resp => { console.log(`${resp.weatherid}(${element}): ${resp.jinsy}`); })
        .catch((error) => {
            console.error(`onRejected function called for ${element}: ${error}`);
        });
    });
}

for (let i = 0; i < process.argv.length; i++) {
    switch (process.argv[i]) {
        case 'test':
            testWeather();
            break;

        default:
            break;
    }
}

exports.getWeather = getWeather;
