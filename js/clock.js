/* clock.js - Realtime clock */
(function (app) {
  "use strict";

  function formatTime(date) {
    if (!date) {
      return "";
    }
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta"
    });
  }

  function formatDate(date) {
    if (!date) {
      return "";
    }
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    });
  }

  function updateClock() {
    var now = new Date();
    var time = formatTime(now);
    var dateText = formatDate(now);
    document.querySelectorAll("[data-clock-time]").forEach(function (element) {
      element.textContent = time;
    });
    document.querySelectorAll("[data-clock-date]").forEach(function (element) {
      element.textContent = dateText;
    });
  }

  var clockTimerId = null;

  app.clock = {
    init: function () {
      if (!document.querySelector("[data-clock-time]") && !document.querySelector("[data-clock-date]")) {
        return;
      }
      updateClock();
      if (!clockTimerId) {
        clockTimerId = window.setInterval(updateClock, 1000);
      }
    },
    formatTime: formatTime
  };
})(window.DusunJamus = window.DusunJamus || {});
