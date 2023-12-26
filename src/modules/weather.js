require("dotenv").config({ path: "./.env" });

exports.getWeather = function (location) {
    return new Promise((resolve, reject) => {

        console.log(`location: ${location}`);

        const req = new Request(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OWM_API_KEY}`);

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
                    console.log(`CODE: ${JSON.stringify(json['cod'], null, 2)}`);
                    switch (json['cod']) {
                        case 404:
                            return reject(`OWM Error ${json['message']}`);

                            break;

                        case 200:
                            var c = parseFloat(json['main']['temp'] - 273.15);
                            var resp = {
                                celcius: parseFloat(c.toFixed(1)),
                                fahrenheit: parseFloat((c * 1.8 + 32).toFixed(1)),
                                humidity: parseFloat(json['main']['humidity']),
                                city: json['name'],
                                country: json['sys']['country'],
                                description: json['weather'][0]['description'],
                                visibility: parseFloat(parseFloat(json['visibility'] / 1000.0).toFixed(1)),
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
