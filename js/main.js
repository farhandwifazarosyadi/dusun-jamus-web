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

  async function loadAboutPreview() {
    var target = document.querySelector("[data-about-description]");
    if (!target) {
      return;
    }

    if (!app.supabase || typeof app.supabase.getSiteProfile !== "function") {
      return;
    }

    try {
      var response = await app.supabase.getSiteProfile();
      if (response && response.data && response.data.short_description) {
        target.textContent = response.data.short_description;
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
      safeInit(app.gallery, "gallery");
      safeInit(app.potentials, "potentials");
      safeInit(app.maps, "maps");
      safeInit(app.weather, "weather");
      safeInit(app.clock, "clock");
      safeInit(app.calendar, "calendar");

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
