/* weather.js - OpenWeather integration */
(function (app) {
  "use strict";

  function updateWeatherDisplay(data) {
    var locationEl = document.querySelector("[data-weather-location]");
    var tempEl = document.querySelector("[data-weather-temp]");
    var descEl = document.querySelector("[data-weather-desc]");
    var iconEl = document.querySelector("[data-weather-icon]");
    var humidityEl = document.querySelector("[data-weather-humidity]");
    if (locationEl) {
      locationEl.textContent = data.location || "Dusun Jamus";
    }
    if (tempEl) {
      tempEl.textContent = data.temp || "-";
    }
    if (descEl) {
      descEl.textContent = data.desc || "Data cuaca belum tersedia";
    }
    if (humidityEl) {
      humidityEl.textContent = data.humidity || "";
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

  function isValidCoordinate(value, min, max) {
    if (value === null || value === undefined || value === "") {
      return false;
    }
    var numeric = typeof value === "number" ? value : parseFloat(value);
    if (!Number.isFinite(numeric)) {
      return false;
    }
    return numeric >= min && numeric <= max;
  }

  app.weather = {
    init: async function () {
      var apiKey = app.config && typeof app.config.get === "function"
        ? app.config.get("openWeatherApiKey")
        : "";
      var locationConfig = app.config && app.config.location ? app.config.location : null;
      var fallbackLocation = locationConfig && locationConfig.name
        ? locationConfig.name
        : "Dusun Jamus";
      var fallbackLat = locationConfig && typeof locationConfig.latitude === "number"
        ? locationConfig.latitude
        : -7.83552;
      var fallbackLng = locationConfig && typeof locationConfig.longitude === "number"
        ? locationConfig.longitude
        : 110.17035;

      async function resolveCoordinates() {
        if (app.supabase && typeof app.supabase.getSiteContacts === "function") {
          try {
            var response = await app.supabase.getSiteContacts();
            var contact = response && response.data && response.data[0] ? response.data[0] : null;
            var latValue = contact && (contact.latitude || contact.lat);
            var lngValue = contact && (contact.longitude || contact.lng);
            if (isValidCoordinate(latValue, -90, 90) && isValidCoordinate(lngValue, -180, 180)) {
              return { lat: parseFloat(latValue), lng: parseFloat(lngValue) };
            }
          } catch (error) {
            console.warn("Gagal membaca kontak untuk cuaca.", error);
          }
        }
        return { lat: fallbackLat, lng: fallbackLng };
      }

      if (!apiKey) {
        updateWeatherDisplay({
          location: fallbackLocation,
          temp: "-",
          desc: "Data cuaca belum tersedia",
          iconUrl: "",
          humidity: "",
          summary: "Data cuaca belum tersedia"
        });
        if (!apiKey) {
          console.warn("OpenWeather API key belum diisi.");
        }
        return;
      }

      try {
        var coords = await resolveCoordinates();
        var lat = coords.lat;
        var lng = coords.lng;
        var response = await fetch(buildWeatherUrl(apiKey, lat, lng));
        if (!response.ok) {
          updateWeatherDisplay({
            location: fallbackLocation,
            temp: "-",
            desc: "Data cuaca belum tersedia",
            iconUrl: "",
            humidity: "",
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
        var humidity = data.main && typeof data.main.humidity === "number"
          ? "Kelembapan " + data.main.humidity + "%"
          : "";
        var icon = data.weather && data.weather[0] && data.weather[0].icon
          ? data.weather[0].icon
          : "";
        var iconUrl = icon ? "https://openweathermap.org/img/wn/" + icon + "@2x.png" : "";
        updateWeatherDisplay({
          location: fallbackLocation,
          temp: temp,
          desc: desc || "Data cuaca belum tersedia",
          iconUrl: iconUrl,
          humidity: humidity,
          summary: temp + (desc ? " " + desc : "")
        });
      } catch (error) {
        console.warn("Gagal memuat cuaca.", error);
        updateWeatherDisplay({
          location: fallbackLocation,
          temp: "-",
          desc: "Data cuaca belum tersedia",
          iconUrl: "",
          humidity: "",
          summary: "Data cuaca belum tersedia"
        });
      }
    },
    fetchCurrent: function () {
      return null;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
