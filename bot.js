#!/usr/bin/env node

const WebSocketClient = require('websocket').client;
const config = require('./config.json');
const fart = require('./farts.json');

const client = new WebSocketClient();
var channel = config.channel.name;
if (process.argv.length > 2) {
    channel = `#${process.argv[2].toLowerCase()}`;
}
console.log(`channel: ${channel}`);

const account = 'FrumiBot';   // Replace with the account the bot runs as
const password = config.account.password;

const moveMessage = 'Get up and move, your body will thank you!';
// const defaultMoveInterval = 1000 * 60 * 1; // Set to 1 minute for testing.
const defaultMoveInterval = 1000 * 60 * 40;
let moveInterval = defaultMoveInterval;

const notificationMessage = `/me Hi, I'm ${account}, please say hi and ask me about !dice or !weather`;
// const notificationInterval = 1000 * 60 * 1;
const notificationInterval = 1000 * 60 * 60;

client.on('connectFailed', function (error) {
    console.log('Connect Error: twitch --help' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');

    // This is a simple bot that doesn't need the additional
    // Twitch IRC capabilities.

    // connection.sendUTF('CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags');

    // Authenticate with the Twitch IRC server and then join the channel.
    // If the authentication fails, the server drops the connection.

    connection.sendUTF(`PASS ${password}`);
    connection.sendUTF(`NICK ${account}`);

    // Set a timer to post future 'move' messages. This timer can be
    // reset if the user passes, !move [minutes], in chat.
    let intervalObj = setInterval(() => {
        connection.sendUTF(`PRIVMSG ${channel} :${moveMessage}`);
    }, moveInterval);

    // Set a timer to post a notification for FrumiBot.
    let notObj = setInterval(() => {
        connection.sendUTF(`PRIVMSG ${channel} :${notificationMessage}`);
    }, (notificationInterval));

    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function () {
        console.log('Connection Closed');
        console.log(`close description: ${connection.closeDescription}`);
        console.log(`close reason code: ${connection.closeReasonCode}`);

        clearInterval(intervalObj);
    });

    // Process the Twitch IRC message.

    connection.on('message', function (ircMessage) {
        if (ircMessage.type === 'utf8') {
            let rawIrcMessage = ircMessage.utf8Data.trimEnd();
            console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);

            let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
            messages.forEach(message => {
                let parsedMessage = parseMessage(message);

                if (parsedMessage) {
                    // console.log(`Message command: ${parsedMessage.command.command}`);
                    // console.log(`\n${JSON.stringify(parsedMessage, null, 3)}`)

                    switch (parsedMessage.command.command) {
                        case 'PRIVMSG':

                            // Ignore all messages except the '!move' bot
                            // command. A user can post a !move command to change the 
                            // interval for when the bot posts its move message.

                            if ('move' === parsedMessage.command.botCommand) {

                                // Assumes the command's parameter is well formed (e.g., !move 15).

                                let updateInterval = (parsedMessage.command.botCommandParams) ?
                                    parseInt(parsedMessage.command.botCommandParams) * 1000 * 60 : defaultMoveInterval;

                                if (moveInterval != updateInterval) {
                                    // Valid range: 1 minute to 60 minutes
                                    if (updateInterval >= 60000 && updateInterval <= 3600000) {
                                        moveInterval = updateInterval;

                                        // Reset the timer.
                                        clearInterval(intervalObj);
                                        intervalObj = null;
                                        intervalObj = setInterval(() => {
                                            connection.sendUTF(`PRIVMSG ${channel} :${moveMessage}`);
                                        }, moveInterval);
                                    }
                                }
                            }
                            else if ('moveoff' === parsedMessage.command.botCommand) {
                                clearInterval(intervalObj);
                                connection.sendUTF(`PART ${channel}`);
                                connection.close();
                            }
                            else if ('toot' === parsedMessage.command.botCommand) {
                                delay(1000).then(() => connection.sendUTF(`PRIVMSG ${channel} :!chair`));
                            }
                            else if ('hi' === parsedMessage.parameters.toLowerCase()
                                || 'hello' === parsedMessage.parameters.toLowerCase()
                                || 'hello!' === parsedMessage.parameters.toLowerCase()
                                || 'hello' === parsedMessage.command.botCommand) {
                                connection.sendUTF(`PRIVMSG ${channel} :Hi, nice to meet you @${parsedMessage.source.nick}`);
                            }
                            else if ('g2g' === parsedMessage.parameters.toLowerCase()
                                || 'got to go' === parsedMessage.parameters.toLowerCase()) {
                                connection.sendUTF(`PRIVMSG ${channel} :Bye @${parsedMessage.source.nick}, see you later!`);
                            }
                            else if ('dice' === parsedMessage.command.botCommand) {
                                var sides = 6;
                                if (parsedMessage.words.length > 1) {
                                    sides = parsedMessage.words[1];
                                }
                                connection.sendUTF(`PRIVMSG ${channel} :You rolled ${Math.floor(Math.random() * sides) + 1}`);
                            }
                            else if (account.toLowerCase() === parsedMessage.words[0].toLowerCase()) {
                                connection.sendUTF(`PRIVMSG ${channel} :${notificationMessage}`);
                            }
                            else if (
                                'played' === parsedMessage.words[1] &&
                                'FART' === parsedMessage.words[2] &&
                                'for' === parsedMessage.words[3] &&
                                '25' === parsedMessage.words[4] &&
                                'Bits' === parsedMessage.words[5]
                            ) {
                                connection.sendUTF(`PRIVMSG ${channel} :Oh excuse you @${parsedMessage.source.nick}, that was ${randomFart()}!`);
                            }
                            else if ('lurk' === parsedMessage.command.botCommand 
                                || 'brb' === parsedMessage.command.botCommand) {
                                delay(1000).then(() => connection.sendUTF(`PRIVMSG ${channel} :Bye @${parsedMessage.source.nick} o/`));
                            }
                            else if ('weather' === parsedMessage.command.botCommand) {
                                // console.log(`${JSON.stringify(parsedMessage)}`);
                                var location = config.channel.location;
                                if (parsedMessage.words.length > 1) {
                                    location = parsedMessage.words.slice(1).join(' ');
                                }
                                const req = new Request(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${config.OWM.api_key}`);
                                fetch(req)
                                    .then((response) => {
                                        if (!response.ok) {
                                            // connection.sendUTF(`PRIVMSG ${channel} :Yes, there is.`);
                                            connection.sendUTF(`PRIVMSG ${channel} :Stop trying to trick me, there is no weather in ${location}!`);
                                            // throw new Error(`HTTP error: ${response.status}`);
                                        }
                                        return response.json();
                                    })
                                    .then((data) => {
                                        console.log(data);
                                        if (data['cod'] == '404') {
                                            connection.sendUTF(`OWM Error $data['message']`);
                                        } else if (data['cod'] == '200') {
                                            celcius = (parseFloat(data['main']['temp']) - 273.15).toFixed(1);
                                            fahrenheit = (celcius * 1.8 + 32).toFixed(1);
                                            humidity = (parseFloat(data['main']['humidity'])).toFixed(1);
                                            city = data['name'];
                                            country = data['sys']['country'];
                                            description = data['weather'][0]['description'];
                                            visibility = (parseFloat(data['visibility']) / 1000.0).toFixed(1);
                                            connection.sendUTF(`PRIVMSG ${channel} :${celcius}°C/${fahrenheit}°F, ${humidity}% humidity, with ${description} in ${city}, ${country}. Visibility is ${visibility}km`);
                                        }
                                    })
                                    .catch((error) => console.log(`${error}`));
                            }
                            else {
                                // console.log(`${JSON.stringify(parsedMessage)}`);
                                var repl = arsebot([parsedMessage.parameters]);
                                if (repl != parsedMessage.parameters) {
                                    connection.sendUTF(`PRIVMSG ${channel} :/me ${repl}`);
                                }
                            }

                            break;
                        case 'PING':
                            connection.sendUTF('PONG ' + parsedMessage.parameters);
                            break;
                        case '001':
                            // Successfully logged in, so join the channel.
                            connection.sendUTF(`JOIN ${channel}`);
                            break;
                        case 'JOIN':
                            // Send the initial move message. All other move messages are
                            // sent by the timer.
                            // connection.sendUTF(`PRIVMSG ${channel} :${moveMessage}`);
                            connection.sendUTF(`PRIVMSG ${channel} :${notificationMessage}`);
                            break;
                        case 'PART':
                            console.log('The channel must have banned (/ban) the bot.');
                            connection.close();
                            break;
                        case 'NOTICE':
                            // If the authentication failed, leave the channel.
                            // The server will close the connection.
                            if ('Login authentication failed' === parsedMessage.parameters) {
                                console.log(`Authentication failed; left ${channel}`);
                                connection.sendUTF(`PART ${channel}`);
                            }
                            else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
                                console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
                                connection.sendUTF(`PART ${channel}`);
                            }
                            break;
                        default:
                            ; // Ignore all other IRC messages.
                    }
                }
            });
        }
    });

});

client.connect('ws://irc-ws.chat.twitch.tv:80');

// Implement arsebot

function arsebot(inWords) {
    var resp = inWords.toString().replace(/us/g, "arse");
    var respArr = [];
    if (resp !== inWords.toString()) {
        var i = 0;
        var arr = inWords.toString().split(' ');
        // Which word was replaced?
        resp.split(' ').forEach((w) => {
            if (w === arr[i]) {
                respArr.push(w);
            } else {
                respArr.push('arse');
            }
            i++;
        });
        resp = respArr.join(' ').replace(' a arse ', ' an arse ');
    }
    return resp;
}

// Pick a random fart description from the fart json file.

function randomFart() {
    return randomWord(fart.farts);
}

// Pick a random word from the array.

function randomWord(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// To delay a function execution in JavaScript by 1 second, wrap a promise execution
// inside a function and wrap the Promise's resolve() in a setTimeout() as shown below. 
// setTimeout() accepts time in milliseconds, so setTimeout(fn, 1000) tells JavaScript
// to call fn after 1 second.

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Parses an IRC message and returns a JSON object with the message's 
// component parts (tags, source (nick and host), command, parameters). 
// Expects the caller to pass a single message. (Remember, the Twitch 
// IRC server may send one or more IRC messages in a single message.)

function parseMessage(message) {

    let parsedMessage = {  // Contains the component parts.
        tags: null,
        source: null,
        command: null,
        parameters: null,
        words: null
    };

    // The start index. Increments as we parse the IRC message.

    let idx = 0;

    // The raw components of the IRC message.

    let rawTagsComponent = null;
    let rawSourceComponent = null;
    let rawCommandComponent = null;
    let rawParametersComponent = null;

    // If the message includes tags, get the tags component of the IRC message.

    if (message[idx] === '@') {  // The message includes tags.
        let endIdx = message.indexOf(' ');
        rawTagsComponent = message.slice(1, endIdx);
        idx = endIdx + 1; // Should now point to source colon (:).
    }

    // Get the source component (nick and host) of the IRC message.
    // The idx should point to the source part; otherwise, it's a PING command.

    if (message[idx] === ':') {
        idx += 1;
        let endIdx = message.indexOf(' ', idx);
        rawSourceComponent = message.slice(idx, endIdx);
        idx = endIdx + 1;  // Should point to the command part of the message.
    }

    // Get the command component of the IRC message.

    let endIdx = message.indexOf(':', idx);  // Looking for the parameters part of the message.
    if (-1 == endIdx) {                      // But not all messages include the parameters part.
        endIdx = message.length;
    }

    rawCommandComponent = message.slice(idx, endIdx).trim();

    // Get the parameters component of the IRC message.

    if (endIdx != message.length) {  // Check if the IRC message contains a parameters component.
        idx = endIdx + 1;            // Should point to the parameters part of the message.
        rawParametersComponent = message.slice(idx);
    }

    // Parse the command component of the IRC message.

    parsedMessage.command = parseCommand(rawCommandComponent);

    // Only parse the rest of the components if it's a command
    // we care about; we ignore some messages.

    if (null == parsedMessage.command) {  // Is null if it's a message we don't care about.
        return null;
    }
    else {
        if (null != rawTagsComponent) {  // The IRC message contains tags.
            parsedMessage.tags = parseTags(rawTagsComponent);
        }

        parsedMessage.source = parseSource(rawSourceComponent);

        parsedMessage.parameters = rawParametersComponent;
        if (parsedMessage.parameters) parsedMessage.words = parsedMessage.parameters.split(' ');
        if (rawParametersComponent && rawParametersComponent[0] === '!') {
            // The user entered a bot command in the chat window.            
            parsedMessage.command = parseParameters(rawParametersComponent, parsedMessage.command);
        }
    }

    return parsedMessage;
}

// Parses the tags component of the IRC message.

function parseTags(tags) {
    // badge-info=;badges=broadcaster/1;color=#0000FF;...

    const tagsToIgnore = {  // List of tags to ignore.
        'client-nonce': null,
        'flags': null
    };

    let dictParsedTags = {};  // Holds the parsed list of tags.
    // The key is the tag's name (e.g., color).
    let parsedTags = tags.split(';');

    parsedTags.forEach(tag => {
        let parsedTag = tag.split('=');  // Tags are key/value pairs.
        let tagValue = (parsedTag[1] === '') ? null : parsedTag[1];

        switch (parsedTag[0]) {  // Switch on tag name
            case 'badges':
            case 'badge-info':
                // badges=staff/1,broadcaster/1,turbo/1;

                if (tagValue) {
                    let dict = {};  // Holds the list of badge objects.
                    // The key is the badge's name (e.g., subscriber).
                    let badges = tagValue.split(',');
                    badges.forEach(pair => {
                        let badgeParts = pair.split('/');
                        dict[badgeParts[0]] = badgeParts[1];
                    })
                    dictParsedTags[parsedTag[0]] = dict;
                }
                else {
                    dictParsedTags[parsedTag[0]] = null;
                }
                break;
            case 'emotes':
                // emotes=25:0-4,12-16/1902:6-10

                if (tagValue) {
                    let dictEmotes = {};  // Holds a list of emote objects.
                    // The key is the emote's ID.
                    let emotes = tagValue.split('/');
                    emotes.forEach(emote => {
                        let emoteParts = emote.split(':');

                        let textPositions = [];  // The list of position objects that identify
                        // the location of the emote in the chat message.
                        let positions = emoteParts[1].split(',');
                        positions.forEach(position => {
                            let positionParts = position.split('-');
                            textPositions.push({
                                startPosition: positionParts[0],
                                endPosition: positionParts[1]
                            })
                        });

                        dictEmotes[emoteParts[0]] = textPositions;
                    })

                    dictParsedTags[parsedTag[0]] = dictEmotes;
                }
                else {
                    dictParsedTags[parsedTag[0]] = null;
                }

                break;
            case 'emote-sets':
                // emote-sets=0,33,50,237

                let emoteSetIds = tagValue.split(',');  // Array of emote set IDs.
                dictParsedTags[parsedTag[0]] = emoteSetIds;
                break;
            default:
                // If the tag is in the list of tags to ignore, ignore
                // it; otherwise, add it.

                if (tagsToIgnore.hasOwnProperty(parsedTag[0])) {
                    ;
                }
                else {
                    dictParsedTags[parsedTag[0]] = tagValue;
                }
        }
    });

    return dictParsedTags;
}

// Parses the command component of the IRC message.

function parseCommand(rawCommandComponent) {
    let parsedCommand = null;
    commandParts = rawCommandComponent.split(' ');

    switch (commandParts[0]) {
        case 'JOIN':
        case 'PART':
        case 'NOTICE':
        case 'CLEARCHAT':
        case 'HOSTTARGET':
        case 'PRIVMSG':
            parsedCommand = {
                command: commandParts[0],
                channel: commandParts[1]
            }
            break;
        case 'PING':
            parsedCommand = {
                command: commandParts[0]
            }
            break;
        case 'CAP':
            parsedCommand = {
                command: commandParts[0],
                isCapRequestEnabled: (commandParts[2] === 'ACK') ? true : false,
                // The parameters part of the messages contains the 
                // enabled capabilities.
            }
            break;
        case 'GLOBALUSERSTATE':  // Included only if you request the /commands capability.
            // But it has no meaning without also including the /tags capability.
            parsedCommand = {
                command: commandParts[0]
            }
            break;
        case 'USERSTATE':   // Included only if you request the /commands capability.
        case 'ROOMSTATE':   // But it has no meaning without also including the /tags capabilities.
            parsedCommand = {
                command: commandParts[0],
                channel: commandParts[1]
            }
            break;
        case 'RECONNECT':
            console.log('The Twitch IRC server is about to terminate the connection for maintenance.')
            parsedCommand = {
                command: commandParts[0]
            }
            break;
        case '421':
            console.log(`Unsupported IRC command: ${commandParts[2]}`)
            return null;
        case '001':  // Logged in (successfully authenticated). 
            parsedCommand = {
                command: commandParts[0],
                channel: commandParts[1]
            }
            break;
        case '002':  // Ignoring all other numeric messages.
        case '003':
        case '004':
        case '353':  // Tells you who else is in the chat room you're joining.
        case '366':
        case '372':
        case '375':
        case '376':
            console.log(`numeric message: ${commandParts[0]}`)
            return null;
        default:
            console.log(`\nUnexpected command: ${commandParts[0]}\n`);
            return null;
    }

    return parsedCommand;
}

// Parses the source (nick and host) components of the IRC message.

function parseSource(rawSourceComponent) {
    if (null == rawSourceComponent) {  // Not all messages contain a source
        return null;
    }
    else {
        let sourceParts = rawSourceComponent.split('!');
        return {
            nick: (sourceParts.length == 2) ? sourceParts[0] : null,
            host: (sourceParts.length == 2) ? sourceParts[1] : sourceParts[0]
        }
    }
}

// Parsing the IRC parameters component if it contains a command (e.g., !dice).

function parseParameters(rawParametersComponent, command) {
    let idx = 0
    let commandParts = rawParametersComponent.slice(idx + 1).trim();
    let paramsIdx = commandParts.indexOf(' ');

    if (-1 == paramsIdx) { // no parameters
        command.botCommand = commandParts.slice(0);
    }
    else {
        command.botCommand = commandParts.slice(0, paramsIdx);
        command.botCommandParams = commandParts.slice(paramsIdx).trim();
        // TODO: remove extra spaces in parameters string
    }

    return command;
}
