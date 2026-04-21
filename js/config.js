/* config.js - Frontend configuration and environment placeholders */
(function (app) {
  "use strict";

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
    supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY",
    openWeatherApiKey: "YOUR_OPENWEATHER_API_KEY",
    normalize: function () {
      app.config.supabaseUrl = normalizeValue(app.config.supabaseUrl);
      app.config.supabaseAnonKey = normalizeValue(app.config.supabaseAnonKey);
      app.config.googleMapsApiKey = normalizeValue(app.config.googleMapsApiKey);
      app.config.openWeatherApiKey = normalizeValue(app.config.openWeatherApiKey);
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
    app.config.googleMapsApiKey = env.GOOGLE_MAPS_API_KEY || app.config.googleMapsApiKey;
    app.config.openWeatherApiKey = env.OPENWEATHER_API_KEY || app.config.openWeatherApiKey;
    app.config.normalize();
  };

  app.config.normalize();
  app.config.setFromEnv(window.__ENV || null);
})(window.DusunJamus = window.DusunJamus || {});
