/* weather.js - OpenWeather integration */
(function (app) {
  "use strict";

  function updateWeatherDisplay(data) {
    var locationEl = document.querySelector("[data-weather-location]");
    var tempEl = document.querySelector("[data-weather-temp]");
    var descEl = document.querySelector("[data-weather-desc]");
    var iconEl = document.querySelector("[data-weather-icon]");
    if (locationEl) {
      locationEl.textContent = data.location || "Dusun Jamus";
    }
    if (tempEl) {
      tempEl.textContent = data.temp || "-";
    }
    if (descEl) {
      descEl.textContent = data.desc || "Data cuaca belum tersedia";
    }
    if (iconEl) {
      if (data.iconUrl) {
        iconEl.src = data.iconUrl;
        iconEl.classList.remove("is-hidden");
      } else {
        iconEl.removeAttribute("src");
        iconEl.classList.add("is-hidden");
      }
    }

    var contactText = document.querySelector("[data-weather-text]");
    if (contactText) {
      contactText.textContent = data.summary || data.desc || "Data cuaca belum tersedia";
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
      var lat = location.lat || -7.6062;
      var lng = location.lng || 110.8467;
      var fallbackLocation = "Dusun Jamus";

      if (!apiKey) {
        updateWeatherDisplay({
          location: fallbackLocation,
          temp: "-",
          desc: "Data cuaca belum tersedia",
          iconUrl: "",
          summary: "Data cuaca belum tersedia"
        });
        if (!apiKey) {
          console.warn("OpenWeather API key belum diisi.");
        }
        return;
      }

      try {
        var response = await fetch(buildWeatherUrl(apiKey, lat, lng));
        if (!response.ok) {
          updateWeatherDisplay({
            location: fallbackLocation,
            temp: "-",
            desc: "Data cuaca belum tersedia",
            iconUrl: "",
            summary: "Data cuaca belum tersedia"
          });
          return;
        }
        var data = await response.json();
        var temp = data.main && typeof data.main.temp === "number"
          ? Math.round(data.main.temp) + "°C"
          : "-";
        var desc = data.weather && data.weather[0] && data.weather[0].description
          ? data.weather[0].description
          : "";
        var icon = data.weather && data.weather[0] && data.weather[0].icon
          ? data.weather[0].icon
          : "";
        var iconUrl = icon ? "https://openweathermap.org/img/wn/" + icon + "@2x.png" : "";
        var locationName = data.name || fallbackLocation;
        updateWeatherDisplay({
          location: locationName,
          temp: temp,
          desc: desc || "Data cuaca belum tersedia",
          iconUrl: iconUrl,
          summary: temp + (desc ? " " + desc : "")
        });
      } catch (error) {
        console.warn("Gagal memuat cuaca.", error);
        updateWeatherDisplay({
          location: fallbackLocation,
          temp: "-",
          desc: "Data cuaca belum tersedia",
          iconUrl: "",
          summary: "Data cuaca belum tersedia"
        });
      }
    },
    fetchCurrent: function () {
      return null;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
