// Fetches current weather for Stuttgart from Open-Meteo and drives the
// cloud icon, weather panel, and Frieren's speech bubble line.
(function () {
  const STUTTGART = { latitude: 48.7758, longitude: 9.1829 };
  const API_URL =
    `https://api.open-meteo.com/v1/forecast?latitude=${STUTTGART.latitude}&longitude=${STUTTGART.longitude}&current_weather=true`;

  // WMO weather codes: https://open-meteo.com/en/docs
  const CONDITIONS = [
    { codes: [0], label: "Clear sky", category: "clear" },
    { codes: [1], label: "Mostly clear", category: "clear" },
    { codes: [2], label: "Partly cloudy", category: "clear" },
    { codes: [3], label: "Overcast", category: "clear" },
    { codes: [45, 48], label: "Foggy", category: "fog" },
    { codes: [51, 53, 55], label: "Drizzle", category: "rain" },
    { codes: [56, 57], label: "Freezing drizzle", category: "rain" },
    { codes: [61, 63, 65], label: "Rain", category: "rain" },
    { codes: [66, 67], label: "Freezing rain", category: "rain" },
    { codes: [71, 73, 75], label: "Snow", category: "snow" },
    { codes: [77], label: "Snow grains", category: "snow" },
    { codes: [80, 81, 82], label: "Rain showers", category: "rain" },
    { codes: [85, 86], label: "Snow showers", category: "snow" },
    { codes: [95], label: "Thunderstorm", category: "storm" },
    { codes: [96, 99], label: "Thunderstorm with hail", category: "storm" },
  ];

  // "fine" = clear/partly-cloudy/overcast (no precipitation); everything
  // else (fog, rain, snow, storms) counts as "bad".
  const FINE_CATEGORIES = new Set(["clear"]);

  const LINES = {
    clear: [
      "Clear skies. I've seen ten thousand clear skies.",
      "Fine weather. Suitable for a slow walk to nowhere in particular.",
      "The sun is out. I have no strong feelings about that.",
    ],
    fog: [
      "Fog. I once got lost in one for eighty years. It was fine.",
      "I can't see very far. That's alright, I wasn't going anywhere fast.",
    ],
    rain: [
      "It's raining in Stuttgart. I've seen ten thousand rains.",
      "Rain again. Flamme used to complain about this too.",
      "Wet weather. I'll just wait it out. I have the time.",
    ],
    snow: [
      "Snow. It reminds me of a winter spent memorizing spells.",
      "Snow is falling. I've collected two thousand snowflakes. None were useful.",
    ],
    storm: [
      "A storm approaches. I've survived far worse than thunder.",
      "Lightning. Loud, but harmless to someone who's outlived it a thousand times.",
    ],
    unknown: [
      "The sky is doing something I don't have a name for. I'll allow it.",
      "Even after a thousand years, the weather still finds new ways to be strange.",
    ],
  };

  function findCondition(code) {
    return (
      CONDITIONS.find((entry) => entry.codes.includes(code)) || {
        label: "Unknown",
        category: "unknown",
      }
    );
  }

  function pickLine(category) {
    const options = LINES[category] || LINES.clear;
    return options[Math.floor(Math.random() * options.length)];
  }

  function render(temperature, code) {
    const condition = findCondition(code);
    const isFine = FINE_CATEGORIES.has(condition.category);

    const cloud = document.getElementById("cloud");
    cloud.classList.toggle("bad", !isFine);
    cloud.classList.toggle(
      "show-rain",
      condition.category === "rain" || condition.category === "storm"
    );
    cloud.classList.toggle("show-bolt", condition.category === "storm");

    document.getElementById("weather-status").textContent = "Stuttgart, Germany";
    document.getElementById("weather-temp").textContent = Math.round(temperature);
    document.getElementById("weather-condition").textContent = condition.label;
    document.getElementById("frieren-line").textContent = pickLine(condition.category);
  }

  function renderError() {
    document.getElementById("weather-status").textContent =
      "The skies would not reveal themselves.";
    document.getElementById("frieren-line").textContent =
      "The weather refuses to answer. Rude, but not unusual.";
  }

  fetch(API_URL)
    .then((response) => response.json())
    .then((data) => {
      const current = data.current_weather;
      render(current.temperature, current.weathercode);
    })
    .catch(renderError);
})();
