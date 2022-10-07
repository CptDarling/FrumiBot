const fs = require('fs');
const { refresh } = require('../token');
const config = require('../config.json');
const { getWeather } = require('./weather');
const { resolve } = require('path');
const { diceRoll } = require('./dice');

var dataAvailable = false;
var rules = {
    patterns: [],
    commands: []
};

getData()
    .then(() => console.log('Rules loaded'))
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

    return new Promise((resolve, reject) => {

        if (!dataAvailable) return reject("No data loaded");

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
                var rej = rules.commands[attr].reject;

                const re = new RegExp(p);

                found = re.test(parameters.toString());
                if (found) {

                    // If the response is an array then pick one of the entries.
                    if (Object.prototype.toString.call(r) == '[object Array]') {
                        r = r[Math.floor(Math.random() * r.length)];
                    }

                    // If the reject is an array then pick one of the entries.
                    if (Object.prototype.toString.call(rej) == '[object Array]') {
                        rej = rej[Math.floor(Math.random() * rej.length)];
                    }

                    switch (c) {
                        case 'refresh':
                            var x = r;
                            getData()
                                .then(() => {
                                    var msg = parameters.split(/\s+/).slice(1).join(' ');
                                    msg = x.supplant({
                                        echo: msg,
                                    });
                                    return resolve([msg, 0, 'command', rules.commands[attr].title]);
                                })
                                .catch((e) => {
                                    r = null;
                                    console.error(e);
                                    return reject();
                                });

                            break;

                        case 'dice':
                            r = r.supplant({
                                dice: diceRoll(parameters.split(/\s+/)[1]),
                            });
                            return resolve([r, 0, 'command', rules.commands[attr].title]);

                            break;

                        case 'weather':
                            var location = parameters.split(/\s+/).slice(1).join(' ');
                            if (!location) {
                                location = vargs.location;
                            }
                            getWeather(location, config.OWM.api_key)
                                .then((data) => {
                                    r = r.supplant({
                                        celcius: data.celcius,
                                        fahrenheit: data.fahrenheit,
                                        humidity: data.humidity,
                                        description: data.description,
                                        city: data.city,
                                        country: data.country,
                                        visibility: data.visibility,
                                    })
                                    // console.log(`DATA: ${JSON.stringify(data, null, 2)}`);
                                    // console.log(`r: ${r}`);
                                    return resolve([r, 0, 'command', rules.commands[attr].title]);
                                })
                                .catch((e) => {
                                    switch (e) {
                                        case 404:
                                            var resp = rej.supplant({
                                                location: location
                                            })
                                            return resolve([resp, 0]);

                                            break;

                                        default:
                                            break;
                                    }
                                });

                            break;

                        default:
                            break;
                    }
                    resp = r;
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
                var d = rules.patterns[attr].delay;

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
                    return resolve([r, d, 'response', rules.patterns[attr].title]);
                }
            }
        }

        // if (resp) {
        //     return resolve(resp);
        // }
    })

}