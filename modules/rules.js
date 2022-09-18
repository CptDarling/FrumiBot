const fs = require('fs');
const { refresh } = require('../token');
const config = require('../config.json');
const { getWeather } = require('./weather');

var dataAvailable = false;
var rules = {
    patterns: [],
    commands: []
};

getData()
    .then((state) => console.log('Rules loaded'))
    .catch((e) => console.error(e));

function getData() {
    return new Promise((resolve, reject) => {
    dataAvailable = false;
    fs.readFile('./rules.json', 'utf8', (err, data) => {
        if (err) {
                return reject(err);
        }
            try {
                dataAvailable = true;
            var r = JSON.parse(data);
            rules = r;
                return resolve();
            } catch (err) {
                return reject(err);
        }
    });
    })
}

exports.processRules = async function (self, username, parameters, vargs) {

    if (!dataAvailable) return;

    var resp = null;
    var found = false;
    var title;

    // Commands
    if (!resp) {
        for (var attr in rules.commands) {
            var c = rules.commands[attr].command;
            var p = rules.commands[attr].pattern.supplant({
                self: self
            });
            var r = rules.commands[attr].response;
            const re = new RegExp(p);

            found = re.test(parameters.toString());
            if (found) {

                // If the response is an array then pick one of the entries.
                if (Object.prototype.toString.call(r) == '[object Array]') {
                    r = r[Math.floor(Math.random() * r.length)];
                }

                switch (c) {
                    case 'refresh':
                        await getData()
                            .then(() => {
                            var msg = parameters.split(/\s+/).slice(1).join(' ');
                            r = r.supplant({
                                echo: msg,
                            });
                                console.log(`Refreshed: ${r}`);
                            })
                            .catch((e) => {
                                r = null;
                                console.error(e);
                            });

                        break;

                    case 'dice':
                        r = r.supplant({
                            dice: rollDice(parameters.split(/\s+/)[1]),
                        });

                        break;

                    case 'weather':
                        var location = parameters.split(/\s+/).slice(1).join(' ');
                        if (!location) {
                            location = vargs.location;
                        }
                        var data = await getWeather(location, config.OWM.api_key);
                        if (data) {
                            r = r.supplant({
                                celcius: data.celcius,
                                fahrenheit: data.fahrenheit,
                                humidity: data.humidity,
                                description: data.description,
                                city: data.city,
                                country: data.country,
                                visibility: data.visibility,
                            })
                        }

                        break;

                    default:
                        break;
                }
                resp = r;
                console.log(`Ran command: '${rules.commands[attr].title}'`);
            }
        }
    }

    // Simple string patterns
    if (!resp) {
        for (var attr in rules.patterns) {
            title = rules.patterns[attr].title;
            var p = rules.patterns[attr].pattern.supplant({
                self: self
            });
            var r = rules.patterns[attr].response;
            var c = rules.patterns[attr].choices;

            const re = new RegExp(p, 'i');

            found = re.test(parameters.toString());
            if (found) {
                // If the response is an array then pick one of the entries.
                if (Object.prototype.toString.call(r) == '[object Array]') {
                    r = r[Math.floor(Math.random() * r.length)];
                }
                // Pick a choice if there are any.
                if (Object.prototype.toString.call(c) == '[object Array]') {
                    r = r.supplant({
                        choose: c[Math.floor(Math.random() * c.length)]
                    });
                }
                resp = r;
                console.log(`Ran response: '${rules.patterns[attr].title}'`);
            }
        }
    }

    if (resp) {
        return resp;
    }

}

function rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
}
