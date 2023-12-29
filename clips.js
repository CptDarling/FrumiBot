require("dotenv").config({ path: "./.env" });
const { access_token } = require("./token.json");
const { writeFile } = require("fs");

const STREAMER_NAME = '680776397';
const clipsArray = [];

let apiUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${STREAMER_NAME}&first=100`;

exports.getClipsArray = () => {
  return clipsArray;
}

exports.getRandomClip = () => {
  arr = this.getClipsArray();
  const randomElement = arr[Math.floor(Math.random() * arr.length)];
  return randomElement;
}

const fetchClips = (url) => {
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
        apiUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${STREAMER_NAME}&first=100&after=${pagination.cursor}`;
        return fetchClips(apiUrl);
      } else {
        return clipsArray;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
};

fetchClips(apiUrl)
  .then(clips => {
    // console.log(JSON.stringify(clips)); // Array of clips
  });

exports.doLoadClips = function () {
  fetchClips(apiUrl)
    .then(clips => {
      console.log(`doLoadClips -> Number of clips: ${clipsArray.length}`)
      // console.log(JSON.stringify(clips)); // Array of clips
    });
  }

for (let i = 0; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case 'cliptest':
      setTimeout(function () {
        // console.log(JSON.stringify(clipsArray))
        console.log(`Number of clips: ${clipsArray.length}`)
      }, 10000
      );
      break;

    default:
      break;
  }
}