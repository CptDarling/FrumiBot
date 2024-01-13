
const URL = 'https://icanhazdadjoke.com/';

exports.dadJoke = function () {
  const headers = {}

  return fetch(URL, {
    headers: {
      "Accept": "text/plain",
    }
  })
    .then(response => response.text())
    .then((text) => {
      console.log(text);
      return text;
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

this.dadJoke();