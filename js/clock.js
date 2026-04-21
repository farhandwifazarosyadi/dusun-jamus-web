/* clock.js - Realtime clock */
(function (app) {
  "use strict";

  function formatTime(date) {
    if (!date) {
      return "";
    }
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function updateClock() {
    var time = formatTime(new Date());
    var homePanel = document.querySelector("#clock-panel p");
    if (homePanel) {
      homePanel.textContent = time;
    }
    var contactClock = document.querySelector("[data-clock-time]");
    if (contactClock) {
      contactClock.textContent = time;
    }
  }

  app.clock = {
    init: function () {
      updateClock();
      window.setInterval(updateClock, 1000 * 30);
    },
    formatTime: formatTime
  };
})(window.DusunJamus = window.DusunJamus || {});
