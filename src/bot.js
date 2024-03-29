#!/usr/bin/env node

const WebSocketClient = require('websocket').client;
const { boolean } = require('yargs');
var modules = require("./modules");
const token = require('./token');
const { welcome } = require('../rules.json');
const { doLoadClips } = require('../clips.js');

// Argument processing
const vargs = require('yargs')
    .option('c', {
        alias: 'channel',
        describe: 'Connect to the named channel',
        default: 'frumious__bandersnatch',
        type: 'string'
    })
    .option('l', {
        alias: 'location',
        describe: 'Location for weather reports',
        default: 'Wrocław',
        type: 'string'
    })
    .describe('noconnect', "Don't connect, used for debugging")
    .describe('quiet', 'Suppress the chat welcome message on bot startup')
    .help()
    .argv;

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

channel = `#${vargs.channel}`;
console.log(`channel: ${channel}`);

const client = new WebSocketClient();
var global_connection;

const account = 'FrumiBot';   // Replace with the account the bot runs as
const password = `oauth:${token.tokendata.access_token}`;

const announcement = welcome.supplant({ self: account });

// const notificationInterval = 1000 * 60 * 1;
const notificationInterval = 1000 * 60 * 60;

client.on('connectFailed', function (error) {
    console.log('Connect Error: twitch --help' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    global_connection = connection;

    // This is a simple bot that doesn't need the additional
    // Twitch IRC capabilities.

    connection.sendUTF('CAP REQ :twitch.tv/commands twitch.tv/membership twitch.tv/tags');

    // Authenticate with the Twitch IRC server and then join the channel.
    // If the authentication fails, the server drops the connection.

    connection.sendUTF(`PASS ${password}`);
    connection.sendUTF(`NICK ${account}`);

    // Set a timer to post a notification for FrumiBot.
    let notObj = setInterval(() => {
        connection.sendUTF(`PRIVMSG ${channel} :${announcement}`);
    }, (notificationInterval));
    if (!vargs.quiet) {
        connection.sendUTF(`PRIVMSG ${channel} :${announcement}`);
    } else {
        console.log('Starting quietly')
    }

    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function () {
        console.log('Connection Closed');
        console.log(`close description: ${connection.closeDescription}`);
        console.log(`close reason code: ${connection.closeReasonCode}`);
    });

    // Grab all the clips from the bradcaster.
    doLoadClips(vargs.channel);

    // Process the Twitch IRC message.

    connection.on('message', function (ircMessage) {
        if (ircMessage.type === 'utf8') {

            let rawIrcMessage = ircMessage.utf8Data.trimEnd();
            console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'`);

            let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
            messages.forEach(message => {
                let parsedMessage = parseMessage(message);
                if (parsedMessage) {
                    // console.log(`Message command: ${parsedMessage.command.command}`);
                    // console.log(`\n${JSON.stringify(parsedMessage, null, 3)}`)
                    // console.log("parsedMessage: ", parsedMessage)
                    switch (parsedMessage.command.command) {
                        case 'PRIVMSG':
                            asyncCall(account, parsedMessage, connection);
                            break;
                        case 'WHISPER':
                            console.log(`WHISPER: ${parsedMessage}`);
                            break;
                        case 'PING':
                            connection.sendUTF('PONG ' + parsedMessage.parameters);
                            break;
                        case '001':
                            // Successfully logged in, so join the channel.
                            connection.sendUTF(`JOIN ${channel}`);
                            break;
                        case 'JOIN':
                            // This is the standard JOIN message that you receive when a user joins the chat room.
                            console.log(`JOIN: ${parsedMessage.source.nick} has joined the chat`);
                            break;
                        case 'PART':
                            console.log(`EXIT: ${parsedMessage.source.nick} has left the chat.`);
                            // console.log('The channel must have banned (/ban) the bot.');
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

if (!vargs.noconnect) {
    client.connect('ws://irc-ws.chat.twitch.tv:80');
}

async function asyncCall(self, parsedMessage, connection) {
    // console.log(`${JSON.stringify(parsedMessage)}`);
    let user = parsedMessage.source.nick;
    let parameters = parsedMessage.parameters;
    await modules.rules.processRules(self, user, parameters, vargs)
        .then((resp) => {
            // console.log(msg);
            var rawMessage = resp[0];
            var delayTime = resp[1];
            var modCheck = resp[2];
            var interactionType = resp[3];
            var subjectText = resp[4];
            if (rawMessage) {
                var send = `${rawMessage}`.supplant({
                    nick: user,
                    self: self,
                    welcome: announcement,
                    0: parameters.split(/\s+/).shift()
                });
                if (modCheck) {
                    // only send if the chat is from a mod or the broadcaster
                    if (parsedMessage.tags.mod == 1 || parsedMessage.tags.badges.broadcaster == 1) {
                        if (sendtext(send, delayTime, connection)) {
                            if (parsedMessage.tags.badges.broadcaster == 1) {
                                console.log(`Broadcaster ran ${interactionType}: ${subjectText}`);
                            } else {
                                console.log(`Moderator ran ${interactionType}: ${subjectText}`);
                            }
                        };
                    }
                } else {
                    if (sendtext(send, delayTime, connection)) {
                        console.log(`Ran ${interactionType}: ${subjectText}`);
                    };
                }
            }
        })
        .catch((e) => console.error(e));
}

function get_connection() {
    return global_connection;
}
exports.get_connection = get_connection;

function get_channel() {
    return channel;
}

/**
 *
 * @param {*} text
 * @param {*} delay_seconds
 * @param {*} connection
 * @returns
 */
function sendtext(text, delay_seconds = 0, connection = undefined) {
    var resp = false;

    if (!connection) {
        connection = get_connection();
    }

    if (text) {
        text = `PRIVMSG ${get_channel()} :${text}`;
        // console.log(text);
        if (delay_seconds > 0) {
            delay(delay_seconds).then(() => connection.sendUTF(text));
        } else {
            connection.sendUTF(text);
        }
        resp = true;
    }
    return resp;
}
exports.sendtext = sendtext;

// To delay a function execution in JavaScript by 1 second, wrap a promise execution
// inside a function and wrap the Promise's resolve() in a setTimeout() as shown below.
// setTimeout() accepts time in milliseconds, so setTimeout(fn, 1000) tells JavaScript
// to call fn after 1 second.

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
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
        parameters: null
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
            // console.log("parsedMessage.tags['display-name']", parsedMessage.tags['display-name'])
        }

        parsedMessage.source = parseSource(rawSourceComponent);
        if (parsedMessage.tags) {
            if (parsedMessage.tags['display-name']) {
                parsedMessage.source.nick = parsedMessage.tags['display-name']
            }
            // console.log("parsedMessage.source: ", parsedMessage.source);
            // console.log("parsedMessage.tags['display-name']", parsedMessage.tags['display-name'])
        }

        parsedMessage.parameters = rawParametersComponent;

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
