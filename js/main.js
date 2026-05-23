/* main.js - Application entry point */
(function (app) {
  "use strict";

  function safeInit(namespace, label) {
    if (!namespace || typeof namespace.init !== "function") {
      return;
    }
    try {
      namespace.init();
    } catch (error) {
      console.warn("Init gagal:", label, error);
    }
  }

  function hasAny(selectors) {
    if (!selectors || !selectors.length) {
      return false;
    }
    return selectors.some(function (selector) {
      return !!document.querySelector(selector);
    });
  }

  async function loadAboutPreview() {
    var target = document.querySelector("[data-about-description]");
    var historyTarget = document.querySelector("[data-about-history]");
    var potentialTarget = document.querySelector("[data-about-potential]");
    if (!target) {
      return;
    }

    if (!app.supabase || typeof app.supabase.getSiteProfile !== "function") {
      return;
    }

    try {
      var response = await app.supabase.getSiteProfile();
      if (response && response.data) {
        if (response.data.short_description) {
          target.textContent = response.data.short_description;
        }
        if (historyTarget && response.data.history) {
          historyTarget.textContent = response.data.history;
        }
        if (potentialTarget && response.data.full_description) {
          potentialTarget.textContent = response.data.full_description;
        }
      }
    } catch (error) {
      console.warn("Tentang desa gagal dimuat:", error);
    }
  }

  app.main = {
    init: function () {
      try {
        if (app.supabase && typeof app.supabase.initClient === "function") {
          app.supabase.initClient();
        }
      } catch (error) {
        console.warn("Supabase init gagal:", error);
      }

      safeInit(app.navigation, "navigation");
      safeInit(app.news, "news");
      if (hasAny([".gallery-section", "[data-gallery-track]"])) {
        safeInit(app.gallery, "gallery");
      }
      safeInit(app.potentials, "potentials");
      safeInit(app.karangTaruna, "karangTaruna");
      safeInit(app.umkmCatalog, "umkmCatalog");
      if (hasAny(["[data-contact-section]", "[data-contact-map]"])) {
        safeInit(app.maps, "maps");
      }
      if (hasAny(["[data-weather-panel]", "[data-weather-text]", "[data-weather-location]"])) {
        safeInit(app.weather, "weather");
      }
      if (hasAny(["[data-clock-time]", "[data-clock-date]"])) {
        safeInit(app.clock, "clock");
      }
      if (hasAny(["[data-calendar]"])) {
        safeInit(app.calendar, "calendar");
      }

      loadAboutPreview();
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    try {
      app.main.init();
    } catch (error) {
      console.warn("Bootstrap utama gagal:", error);
    }
  });
})(window.DusunJamus = window.DusunJamus || {});
