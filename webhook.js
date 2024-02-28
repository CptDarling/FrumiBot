// const { access_token } = require("../../token.json");

// fetch('wss://eventsub.wss.twitch.tv/ws', {
//   headers: {
//     'Client-ID': process.env.CLIENT_ID,
//     'Authorization': `Bearer ${access_token}`,
//   }
// })
//   .then(data => {
//     console.log(data);
//   })
//   .catch(error => {
//     console.error(error);
//   })

require("dotenv").config({ path: "./.env" });
const { TES } = require('tesjs');

const tes = new TES({
  identity: {
    id: `${process.env.CLIENT_ID}`,
    secret: `${process.env.CLIENT_SECRET}`,
  },
  listener: {
    type: 'webhook',
    baseURL: 'https://localhost:3000', // Your webhook endpoint
    secret: 'WEBHOOKS_SECRET', // Your secret for verifying payloads
  },
});

tes.on('channel.update', (event) => {
  console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
});

// Subscribe to the channel.update event for a specific user
tes.subscribe('channel.update', { broadcaster_user_id: '1337' })
  .then(() => {
    console.log('Subscription successful');
  })
  .catch(err => {
    console.error(err);
  });
