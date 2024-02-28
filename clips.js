require("dotenv").config({ path: "./.env" });
const { access_token } = require("./token.json");
const { getUser } = require('./users.js')

const clipsArray = [];

const API_BASE = 'https://api.twitch.tv/helix/clips?broadcaster_id=';

exports.getClipsArray = () => {
  return clipsArray;
}

exports.getRandomClip = () => {
  arr = this.getClipsArray();
  const randomElement = arr[Math.floor(Math.random() * arr.length)];
  return randomElement;
}

const fetchClips = (url, user) => {
  console.log(`fetchClips("${url}")`);
  return fetch(url, {
    headers: {
      'Client-ID': process.env.CLIENT_ID,
      'Authorization': `Bearer ${access_token}`, // Optional: Include an access token if required
    },
  })
    .then(response => response.json())
    .then(data => {
      // Process the clips data
      const clips = data.data;
      clipsArray.push(...clips);

      // Check if there are more clips available
      const pagination = data.pagination;
      if (pagination && pagination.cursor) {
        // Fetch the next page of clips
        apiUrl = API_BASE + `${user.id}&first=100&after=${pagination.cursor}`;
        return fetchClips(apiUrl, user);
      } else {
        return clipsArray;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
};

/*
This should be called once by the bot at startup.
*/
exports.doLoadClips = function (channel) {
  getUser(channel)
  .then(user => {
    url = API_BASE + `${user.id}&first=100`;
    fetchClips(url, user)
    .then(clips => {
      console.log(`doLoadClips -> Number of clips: ${clipsArray.length}`)
    });
  })
}

for (let i = 0; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case 'cliptest':
      this.doLoadClips('frumious__bandersnatch');
      break;

    default:
      break;
  }
}