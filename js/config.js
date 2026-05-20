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
    openWeatherApiKey: "YOUR_OPENWEATHER_API_KEY",
    foursquareApiKey: "YOUR_FOURSQUARE_API_KEY",
    location: LOCATION_CONFIG,
    normalize: function () {
      app.config.supabaseUrl = normalizeValue(app.config.supabaseUrl);
      app.config.supabaseAnonKey = normalizeValue(app.config.supabaseAnonKey);
      app.config.openWeatherApiKey = normalizeValue(app.config.openWeatherApiKey);
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
    app.config.openWeatherApiKey = env.OPENWEATHER_API_KEY || app.config.openWeatherApiKey;
    app.config.foursquareApiKey = env.FOURSQUARE_API_KEY || app.config.foursquareApiKey;
    app.config.normalize();
  };

  app.config.normalize();
  app.config.setFromEnv(window.__ENV || null);
})(window.DusunJamus = window.DusunJamus || {});
