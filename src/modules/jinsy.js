/*
https://openweathermap.org/weather-conditions

DATA: {
  "coord": {
    "lon": -1.2022,
    "lat": 52.4563
  },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01n"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 277.42,
    "feels_like": 272.47,
    "temp_min": 276.24,
    "temp_max": 278.66,
    "pressure": 1009,
    "humidity": 89,
    "sea_level": 1009,
    "grnd_level": 993
  },
  "visibility": 10000,
  "wind": {
    "speed": 7.72,
    "deg": 251,
    "gust": 15.67
  },
  "clouds": {
    "all": 7
  },
  "dt": 1703888678,
  "sys": {
    "type": 2,
    "id": 2002461,
    "country": "GB",
    "sunrise": 1703837721,
    "sunset": 1703865460
  },
  "timezone": 0,
  "id": 2643337,
  "name": "Lutterworth",
  "cod": 200
}

 */
const fs = require('fs');

let weather;
getJinsyData()
  .then(() => console.log('Jinsy weather loaded'))
  .catch((e) => console.error(e));

function getJinsyData() {
  return new Promise((resolve, reject) => {
    dataAvailable = false;
    fs.readFile('./weather.json', 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        dataAvailable = true;
        var r = JSON.parse(data);
        weather = r;
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  })
}
exports.getJinsyData;

/*
 Create the initial weather conditions.
 These get written to weather.json
 */
const conditions = {
  weather: {
    200: { main: ["Thunderstorm"], description: ["thunderstorm with light rain"] },
    201: { main: ["Thunderstorm"], description: ["thunderstorm with rain"] },
    202: { main: ["Thunderstorm"], description: ["thunderstorm with heavy rain"] },
    210: { main: ["Thunderstorm"], description: ["light thunderstorm"] },
    211: { main: ["Thunderstorm"], description: ["thunderstorm"] },
    212: { main: ["Thunderstorm"], description: ["heavy thunderstorm"] },
    221: { main: ["Thunderstorm"], description: ["ragged thunderstorm"] },
    230: { main: ["Thunderstorm"], description: ["thunderstorm with light drizzle"] },
    231: { main: ["Thunderstorm"], description: ["thunderstorm with drizzle"] },
    232: { main: ["Thunderstorm"], description: ["thunderstorm with heavy drizzle"] },
    300: { main: ["Drizzle"], description: ["light intensity drizzle"] },
    301: { main: ["Drizzle"], description: ["drizzle"] },
    302: { main: ["Drizzle"], description: ["heavy intensity drizzle"] },
    310: { main: ["Drizzle"], description: ["light intensity drizzle rain"] },
    311: { main: ["Drizzle"], description: ["drizzle rain"] },
    312: { main: ["Drizzle"], description: ["heavy intensity drizzle rain"] },
    313: { main: ["Drizzle"], description: ["shower rain and drizzle"] },
    314: { main: ["Drizzle"], description: ["heavy shower rain and drizzle"] },
    321: { main: ["Drizzle"], description: ["shower drizzle"] },
    500: { main: ["Rain"], description: ["light rain"] },
    501: { main: ["Rain"], description: ["moderate rain"] },
    502: { main: ["Rain"], description: ["heavy intensity rain"] },
    503: { main: ["Rain"], description: ["very heavy rain"] },
    504: { main: ["Rain"], description: ["extreme rain"] },
    511: { main: ["Rain"], description: ["freezing rain"] },
    520: { main: ["Rain"], description: ["light intensity shower rain"] },
    521: { main: ["Rain"], description: ["shower rain"] },
    522: { main: ["Rain"], description: ["heavy intensity shower rain"] },
    531: { main: ["Rain"], description: ["ragged shower rain"] },
    600: { main: ["Snow"], description: ["light snow"] },
    601: { main: ["Snow"], description: ["snow"] },
    602: { main: ["Snow"], description: ["heavy snow"] },
    611: { main: ["Snow"], description: ["sleet"] },
    612: { main: ["Snow"], description: ["light shower sleet"] },
    613: { main: ["Snow"], description: ["shower sleet"] },
    615: { main: ["Snow"], description: ["light rain and snow"] },
    616: { main: ["Snow"], description: ["rain and snow"] },
    610: { main: ["Snow"], description: ["light shower snow"] },
    621: { main: ["Snow"], description: ["shower snow"] },
    622: { main: ["Snow"], description: ["heavy shower snow"] },
    701: { main: ["Mist"], description: ["mist"] },
    711: { main: ["Smoke"], description: ["smoke"] },
    721: { main: ["Haze"], description: ["haze"] },
    731: { main: ["Dust"], description: ["sand/dust whirls"] },
    741: { main: ["Fog"], description: ["fog"] },
    751: { main: ["Sand"], description: ["sand"] },
    761: { main: ["Dust"], description: ["dust"] },
    762: { main: ["Ash"], description: ["volcanic ash"] },
    771: { main: ["Squall"], description: ["squalls"] },
    781: { main: ["Tornado"], description: ["tornado"] },
    800: { main: ["Clear"], description: ["clear sky"] },
    801: { main: ["Clouds", "Helium sheep are sparse like Mrs Trout's chin fur"], description: ["few clouds: 11-25%"] },
    802: { main: ["Clouds", "Your flock is scattering to the corners of Birkets Field"], description: ["scattered clouds: 25-50%"] },
    803: { main: ["Clouds", "Breaks!"], description: ["broken clouds: 51-84%"] },
    804: { main: ["Clouds", "Rams are loose around Grundfelds Dyke"], description: ["overcast clouds: 85-100%"] },
  },
  winds: {

  }
}

// const wind

fs.writeFile("weather.json", JSON.stringify(conditions, null, 2), function (err) {
  if (err) {
    console.log(err);
  }
});

/* Get a random element from the array. */
function rnd(arr) {
  if (arr.length == 1) {
    return arr[0];
  } else if (arr.length == 0) {
    return '';
  }
  return arr[Math.floor(1 + (Math.random() * arr.length - 1))]
}

exports.weatherRepord = (json) => {

  let resp = '';

  // Get the main weather condition texts.
  try {
    const expr = json.weather[0].id;
    o = weather.weather[expr];
    main = rnd(o.main);
    text = rnd(o.description);
    resp = `${main} --> ${text}`
  } catch (error) {
    resp = `Alas, the place of ${json.name} in ${json.sys.country} is of no consequence here, like a jackrabbit in the snow.`;
  }

  // console.log(resp);
  return resp;
  // return JSON.parse(JSON.stringify(dict, null, 2));
}