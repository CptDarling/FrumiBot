const API = 'https://icanhazdadjoke.com/';

exports.dadJoke = function () {
  const headers = {
    headers: {
      "Accept": "text/plain"
    }
  }

  return fetch(API, headers)
    .then(response => response.text())
    .then((text) => {
      console.log(text);
      return text;
    })
    .catch(error => {
      console.error('Error:', error);
      return "I'm not in the mood right now, maybe later."
    });
}

this.dadJoke();