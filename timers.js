const EventEmitter = require('events');
const fs = require('fs');

class MyEmitter extends EventEmitter {

    timerSource;
    timerArray = [];

    constructor() {
        super();
        this.name = 'foo';
        console.log(this.name);

        this.getData()
            .then((res) => {
                console.log('Timers loaded');
                this.timerSource = res;
                this.refreshTimers();
            })
            .catch((e) => console.error(e));

    }

    getData() {
        return new Promise((resolve, reject) => {
            fs.readFile('./timers.json', 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                try {
                    return resolve(JSON.parse(data));
                } catch (err) {
                    return reject(err);
                }
            });
        })
    }

    refreshTimers() {
        this.timerSource.timers.forEach(element => {
            console.log(`Timer: ${element.title}`);
            this.timerArray.push(setInterval(() => {
                dispatchEvent(new Event('timeout'));
                console.log('Interval function hit');
            }, element.seconds * 1000));
        });
        console.log('Timers refreshed');
    }

}

const myEmitter = new MyEmitter();
// Only do this once so we don't loop forever
myEmitter.once('newListener', (event, listener) => {
    if (event === 'event') {
        // Insert a new listener in front
        myEmitter.on('event', () => {
            console.log('B');
        });
    }
});
myEmitter.on('event', () => {
    console.log('A');
});
myEmitter.emit('event');

// import { EventEmitter } from 'node:events';

// var timerSource;
// var timerArray = [];

// function refreshTimers() {
//     timerSource.timers.forEach(element => {
//         console.log(`Timer: ${element.title}`);
//         timerArray.push(setInterval(() => {
//             dispatchEvent(new Event('timeout'));
//             console.log('Interval function hit');
//         }, element.seconds * 1000));
//     });
//     console.log('Timers refreshed');
// }