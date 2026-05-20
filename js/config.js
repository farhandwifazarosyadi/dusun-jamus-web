/* config.js - Frontend configuration and environment placeholders */
(function (app) {
  "use strict";

  var LOCATION_CONFIG = {
    name: "Dusun Jamus",
    fullAddress: "Dusun Jamus, Kecamatan Pengasih, Kabupaten Kulon Progo, DIY",
    latitude: -7.83552,
    longitude: 110.17035,
    timezone: "Asia/Jakarta"
  };

  function normalizeValue(value) {
    if (!value) {
      return "";
    }
    if (typeof value === "string" && value.indexOf("YOUR_") === 0) {
      return "";
    }
    return value;
  }

  app.config = {
    supabaseUrl: "https://kppzjxxgdnqqvrqqpswx.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcHpqeHhnZG5xcXZycXFwc3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODEyMjksImV4cCI6MjA5MjI1NzIyOX0.QZlCKTXuJ6LoCLPty_RTTV_5RtM1CUzyrhlaSbUUukQ",
    weatherProvider: "Open-Meteo",
    weatherApiKey: "",
    weatherLat: LOCATION_CONFIG.latitude,
    weatherLon: LOCATION_CONFIG.longitude,
    weatherTimezone: LOCATION_CONFIG.timezone,
    foursquareApiKey: "YOUR_FOURSQUARE_API_KEY",
    location: LOCATION_CONFIG,
    normalize: function () {
      app.config.supabaseUrl = normalizeValue(app.config.supabaseUrl);
      app.config.supabaseAnonKey = normalizeValue(app.config.supabaseAnonKey);
      app.config.weatherProvider = normalizeValue(app.config.weatherProvider) || "Open-Meteo";
      app.config.weatherApiKey = normalizeValue(app.config.weatherApiKey);
      app.config.weatherLat = normalizeValue(app.config.weatherLat) || LOCATION_CONFIG.latitude;
      app.config.weatherLon = normalizeValue(app.config.weatherLon) || LOCATION_CONFIG.longitude;
      app.config.weatherTimezone = normalizeValue(app.config.weatherTimezone) || LOCATION_CONFIG.timezone;
      app.config.foursquareApiKey = normalizeValue(app.config.foursquareApiKey);
    },
    get: function (key) {
      return normalizeValue(app.config[key]);
    }
  };

  app.config.setFromEnv = function (env) {
    if (!env) {
      return;
    }

    app.config.supabaseUrl = env.SUPABASE_URL || app.config.supabaseUrl;
    app.config.supabaseAnonKey = env.SUPABASE_ANON_KEY || app.config.supabaseAnonKey;
    app.config.weatherProvider = env.WEATHER_API_PROVIDER || app.config.weatherProvider;
    app.config.weatherApiKey = env.WEATHER_API_KEY || app.config.weatherApiKey;
    app.config.weatherLat = env.WEATHER_LAT || app.config.weatherLat;
    app.config.weatherLon = env.WEATHER_LON || app.config.weatherLon;
    app.config.weatherTimezone = env.WEATHER_TIMEZONE || app.config.weatherTimezone;
    app.config.foursquareApiKey = env.FOURSQUARE_API_KEY || app.config.foursquareApiKey;
    app.config.normalize();
  };

  app.config.normalize();
  app.config.setFromEnv(window.__ENV || null);
})(window.DusunJamus = window.DusunJamus || {});
