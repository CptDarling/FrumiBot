const { CLIENT_ID } = require("./client.json");
const { access_token } = require("./token.json");

const { writeFile } = require("fs");

const streamerName = '680776397';
// const clientId = 'z33v75uw1frq74qvmb0i5ppfjggyz1';
// const accessToken = 'jtzajweyg8ay3u4ccz7yivuew6imcm'

let apiUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerName}&first=100`;

const clipsArray = [];

const getClips = (url) => {
  return fetch(url, {
    headers: {
      'Client-ID': CLIENT_ID,
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
        apiUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerName}&first=100&after=${pagination.cursor}`;
        return getClips(apiUrl);
      } else {
        return clipsArray;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
};

getClips(apiUrl)
  .then(clips => {
    console.log(JSON.stringify(clips)); // Array of clips
  });