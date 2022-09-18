const fs = require('fs');
const { refresh } = require('../token');
const config = require('../config.json');

var dataAvailable = false;
var rules = {
    patterns: [],
    commands: []
};

getData();

function getData() {
    return new Promise((resolve, reject) => {
    dataAvailable = false;
    fs.readFile('./rules.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            loop = false;
                return reject(false);
        }
            try {
                dataAvailable = true;
        console.log('Rules loaded');
        dataAvailable = true;
        try {
            var r = JSON.parse(data);
            rules = r;
                return resolve(true);
        } catch (e) {
            console.log(e);
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
                        if (await getData()) {
                            var msg = parameters.split(/\s+/).slice(1).join(' ');
                            r = r.supplant({
                                echo: msg,
                            });
                            console.log(`r: ${r}`);
                        };

                        break;

                    case 'dice':
                        r = r.supplant({
                            dice: rollDice(parameters.split(/\s+/)[1]),
                        });

                        break;

                case 'refresh':
                    getData();

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

            const re = new RegExp(p, 'i');

            found = re.test(parameters.toString());
            if (found) {
                // If the response is an array then pick one of the entries.
                if (Object.prototype.toString.call(r) == '[object Array]') {
                    r = r[Math.floor(Math.random() * r.length)];
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
