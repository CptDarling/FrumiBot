require("dotenv").config({ path: "../../.env" });
const { access_token } = require("../../token.json");
const { getUser } = require('../../users.js')

const API_BASE = 'https://api.twitch.tv/helix/channels/ads?broadcaster_id=';

const getAdSchedule = (url, user) => {
  console.log(`getAdSchedule("${url}")`);
  return fetch(url, {
    headers: {
      'Client-ID': process.env.CLIENT_ID,
      'Authorization': `Bearer ${access_token}`, // Optional: Include an access token if required
    },
  })
    .then(response => response.json())
    .then(json => {
      console.log(json);
      // Process the clips data
      const adSchedule = json.data;
      console.log(adSchedule);
    })
    .catch(error => {
      console.error('Error:', error);
    });
};

for (let i = 0; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case 'test':
      getUser('jackie_codes')
        .then(user => {
          url = API_BASE + `${user.id}`;
          getAdSchedule(url, user).then(data => { console.log(data); })
        })
      break;

    default:
      break;
  }
}