/* weather.js - OpenWeather integration */
(function (app) {
  "use strict";

  function updateWeatherText(text) {
    var panel = document.getElementById("weather-panel");
    if (panel) {
      var paragraph = panel.querySelector("p");
      if (paragraph) {
        paragraph.textContent = text;
      }
    }

    var contactText = document.querySelector("[data-weather-text]");
    if (contactText) {
      contactText.textContent = text;
    }
  }

  function buildWeatherUrl(apiKey, lat, lng) {
    return "https://api.openweathermap.org/data/2.5/weather?lat=" +
      encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) +
      "&appid=" + encodeURIComponent(apiKey) + "&units=metric&lang=id";
  }

  app.weather = {
    init: async function () {
      var apiKey = app.config && typeof app.config.get === "function"
        ? app.config.get("openWeatherApiKey")
        : "";

      var location = app.contact || {};
      var lat = location.lat || "";
      var lng = location.lng || "";

      if (!apiKey || !lat || !lng) {
        updateWeatherText("Data cuaca belum tersedia");
        if (!apiKey) {
          console.warn("OpenWeather API key belum diisi.");
        }
        return;
      }

      try {
        var response = await fetch(buildWeatherUrl(apiKey, lat, lng));
        if (!response.ok) {
          updateWeatherText("Data cuaca belum tersedia");
          return;
        }
        var data = await response.json();
        var temp = data.main && typeof data.main.temp === "number"
          ? Math.round(data.main.temp) + "°C"
          : "-";
        var desc = data.weather && data.weather[0] && data.weather[0].description
          ? data.weather[0].description
          : "";
        updateWeatherText(temp + " " + desc);
      } catch (error) {
        console.warn("Gagal memuat cuaca.", error);
        updateWeatherText("Data cuaca belum tersedia");
      }
    },
    fetchCurrent: function () {
      return null;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
