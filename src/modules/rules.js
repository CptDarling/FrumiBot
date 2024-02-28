const fs = require('fs');
const { refresh } = require('../../token.json');
const { getWeather } = require('./weather');
const { resolve } = require('path');
const { diceRoll } = require('./dice');
const { dadJoke } = require('./dadjokes');
const { backseat, backseatMode } = require('./backseat');
const { getRandomClip } = require('../../clips.js');

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

        let executed;

        // Commands
        if (!resp) {
            for (var attr in rules.commands) {
                var c = rules.commands[attr].command;
                var p = rules.commands[attr].pattern.supplant({
                    self: self
                });
                var r = rules.commands[attr].response;
                var rej = rules.commands[attr].reject;
                var mod = rules.patterns[attr].mod_only;

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

                        case 'joke':

                            /*
                                Need to return a promise from this call because it relies
                                on a web service.  When we get a response then we can supplant the
                                received text into our defined command string then resolve the result.
                             */
                            dadJoke().then((text) => {
                                msg = text;
                                r = r.supplant({
                                    joke: msg,
                                })
                                return resolve([r, 0, mod, 'command', rules.commands[attr].title]);

                            });


                            // Stop the for loop.
                            executed = true;


                            break;

                        case 'clip':
                            aClip = getRandomClip();
                            console.log(aClip);
                            date = new Date(aClip.created_at);
                            r =r.supplant({
                                clip: aClip.url,
                                created: new Intl.DateTimeFormat('en-GB', {
                                    dateStyle: 'full',
                                    timeStyle: 'long',
                                    timeZone: 'Europe/Warsaw',
                                }).format(date)
                            });
                            return resolve([r, 0, mod, 'command', rules.commands[attr].title]);

                            // Stop the for loop.
                            executed = true;

                            break;

                        case 'refresh':
                            getData();

                            var msg = parameters.split(/\s+/).slice(1).join(' ');
                            r = r.supplant({
                                echo: msg,
                            });

                            return resolve([r, 0, mod, 'command', rules.commands[attr].title]);

                            // Stop the for loop.
                            executed = true;

                            break;

                        case 'dice':
                            r = r.supplant({
                                dice: diceRoll(parameters.split(/\s+/)[1]),
                            });

                            return resolve([r, 0, 'command', rules.commands[attr].title]);

                            // Stop the for loop.
                            executed = true;

                            break;

                        case 'backseat':
                            backseatMode.backseat = !backseatMode.backseat;
                            if (backseatMode.backseat) {

                            } else {

                            }
                            return resolve([r, 0, 'command', rules.commands[attr].title]);

                            // Stop the for loop.
                            executed = true;

                            break;

                        case 'weather':
                            var location = parameters.split(/\s+/).slice(1).join(' ');
                            if (!location) {
                                location = vargs.location;
                            }
                            getWeather(location)
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
                                    return resolve([r, 0, mod, 'command', rules.commands[attr].title]);
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

                            // Stop the for loop.
                            executed = true;

                            break;

                        default:
                            break;
                    }
                    resp = r;
                }
                if (executed) {
                    break;
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
                var mod = rules.patterns[attr].mod_only;

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
                    return resolve([r, d, mod, 'response', rules.patterns[attr].title]);
                }
            }
        }

    })

}