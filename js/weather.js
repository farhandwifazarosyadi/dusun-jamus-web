/* weather.js - Open-Meteo integration */
(function (app) {
  "use strict";

  function updateWeatherDisplay(data) {
    var locationEl = document.querySelector("[data-weather-location]");
    var tempEl = document.querySelector("[data-weather-temp]");
    var descEl = document.querySelector("[data-weather-desc]");
    var iconEl = document.querySelector("[data-weather-icon]");
    var humidityEl = document.querySelector("[data-weather-humidity]");
    var feelsEl = document.querySelector("[data-weather-feels]");
    var rainEl = document.querySelector("[data-weather-rain]");
    var windEl = document.querySelector("[data-weather-wind]");
    if (locationEl) {
      locationEl.textContent = data.location || "Dusun Jamus, Kecamatan Pengasih, Kabupaten Kulon Progo, DIY";
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
    if (feelsEl) {
      feelsEl.textContent = data.feels || "";
    }
    if (rainEl) {
      rainEl.textContent = data.rain || "";
    }
    if (windEl) {
      windEl.textContent = data.wind || "";
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

    var forecastList = document.querySelector("[data-weather-forecast]");
    if (forecastList) {
      forecastList.innerHTML = "";
      if (data.forecast && data.forecast.length) {
        data.forecast.forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = item;
          forecastList.appendChild(li);
        });
      }
    }
  }

  function buildWeatherUrl(lat, lng, timezone) {
    return "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(lat) + "&longitude=" + encodeURIComponent(lng) +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=" + encodeURIComponent(timezone) + "&forecast_days=3";
  }

  function getWeatherDescription(code) {
    var weatherCodes = {
      0: "Cerah",
      1: "Sebagian cerah",
      2: "Berawan",
      3: "Mendung",
      45: "Berkabut",
      48: "Kabut beku",
      51: "Gerimis ringan",
      53: "Gerimis",
      55: "Gerimis lebat",
      61: "Hujan ringan",
      63: "Hujan",
      65: "Hujan lebat",
      71: "Salju ringan",
      73: "Salju",
      75: "Salju lebat",
      80: "Hujan lokal ringan",
      81: "Hujan lokal",
      82: "Hujan lokal lebat",
      95: "Badai petir",
      96: "Badai petir + hujan es",
      99: "Badai petir + hujan es lebat"
    };
    return weatherCodes[code] || "Data cuaca belum tersedia";
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
      var weatherLat = app.config && typeof app.config.get === "function"
        ? app.config.get("weatherLat")
        : "";
      var weatherLon = app.config && typeof app.config.get === "function"
        ? app.config.get("weatherLon")
        : "";
      var weatherTimezone = app.config && typeof app.config.get === "function"
        ? app.config.get("weatherTimezone")
        : "Asia/Jakarta";
      var locationConfig = app.config && app.config.location ? app.config.location : null;
      var fallbackLocation = locationConfig && locationConfig.name
        ? locationConfig.name
        : "Dusun Jamus";
      var fullLocation = locationConfig && locationConfig.fullAddress
        ? locationConfig.fullAddress
        : "Dusun Jamus, Kecamatan Pengasih, Kabupaten Kulon Progo, DIY";
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

      try {
        var coords = await resolveCoordinates();
        var lat = isValidCoordinate(weatherLat, -90, 90) ? parseFloat(weatherLat) : coords.lat;
        var lng = isValidCoordinate(weatherLon, -180, 180) ? parseFloat(weatherLon) : coords.lng;
        var response = await fetch(buildWeatherUrl(lat, lng, weatherTimezone));
        if (!response.ok) {
          updateWeatherDisplay({
            location: fullLocation,
            temp: "-",
            desc: "Data cuaca belum tersedia",
            iconUrl: "",
            humidity: "",
            feels: "",
            rain: "",
            wind: "",
            forecast: [],
            summary: "Data cuaca belum tersedia"
          });
          return;
        }
        var data = await response.json();
        var temp = data.current && typeof data.current.temperature_2m === "number"
          ? Math.round(data.current.temperature_2m) + "°C"
          : "-";
        var feels = data.current && typeof data.current.apparent_temperature === "number"
          ? "Terasa " + Math.round(data.current.apparent_temperature) + "°C"
          : "";
        var humidity = data.current && typeof data.current.relative_humidity_2m === "number"
          ? "Kelembapan " + data.current.relative_humidity_2m + "%"
          : "";
        var rain = data.current && typeof data.current.precipitation === "number"
          ? "Curah hujan " + data.current.precipitation + " mm"
          : "";
        var wind = data.current && typeof data.current.wind_speed_10m === "number"
          ? "Angin " + data.current.wind_speed_10m + " km/jam"
          : "";
        var weatherCode = data.current && typeof data.current.weather_code === "number"
          ? data.current.weather_code
          : null;
        var desc = weatherCode !== null ? getWeatherDescription(weatherCode) : "";
        var forecast = [];
        if (data.daily && data.daily.time && data.daily.time.length) {
          var maxTemps = data.daily.temperature_2m_max || [];
          var minTemps = data.daily.temperature_2m_min || [];
          var rainChance = data.daily.precipitation_probability_max || [];
          forecast = data.daily.time.slice(0, 3).map(function (dateValue, index) {
            var dateObj = new Date(dateValue);
            var dateLabel = dateObj.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              timeZone: weatherTimezone
            });
            var maxLabel = typeof maxTemps[index] === "number" ? Math.round(maxTemps[index]) + "°" : "-";
            var minLabel = typeof minTemps[index] === "number" ? Math.round(minTemps[index]) + "°" : "-";
            var rainLabel = typeof rainChance[index] === "number" ? rainChance[index] + "%" : "-";
            return dateLabel + ": " + maxLabel + "/" + minLabel + " • Hujan " + rainLabel;
          });
        }
        updateWeatherDisplay({
          location: fullLocation,
          temp: temp,
          desc: desc || "Data cuaca belum tersedia",
          humidity: humidity,
          feels: feels,
          rain: rain,
          wind: wind,
          forecast: forecast,
          summary: temp + (desc ? " " + desc : "")
        });
      } catch (error) {
        console.warn("Gagal memuat cuaca.", error);
        updateWeatherDisplay({
          location: fullLocation,
          temp: "-",
          desc: "Data cuaca belum tersedia",
          iconUrl: "",
          humidity: "",
          feels: "",
          rain: "",
          wind: "",
          forecast: [],
          summary: "Data cuaca belum tersedia"
        });
      }
    },
    fetchCurrent: function () {
      return null;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
