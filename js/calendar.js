/* calendar.js - Simple monthly calendar */
(function (app) {
  "use strict";

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function getMonthLabel(date) {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  function buildCalendar(container, currentDate) {
    container.innerHTML = "";

    var header = createElement("div", "calendar-header");
    var title = createElement("div", "calendar-title", getMonthLabel(currentDate));
    var actions = createElement("div", "calendar-actions");
    var prevBtn = createElement("button", "calendar-btn", "<");
    var nextBtn = createElement("button", "calendar-btn", ">");
    prevBtn.type = "button";
    nextBtn.type = "button";

    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);
    header.appendChild(title);
    header.appendChild(actions);

    var grid = createElement("div", "calendar-grid");

    var weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    weekdayLabels.forEach(function (label) {
      grid.appendChild(createElement("div", "calendar-cell is-header", label));
    });

    var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    var startDayIndex = firstDay.getDay();
    var daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    var prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (var i = startDayIndex - 1; i >= 0; i -= 1) {
      var day = prevMonthDays - i;
      grid.appendChild(createElement("div", "calendar-cell is-muted", String(day)));
    }

    var today = new Date();
    for (var date = 1; date <= daysInMonth; date += 1) {
      var cellClass = "calendar-cell";
      if (
        date === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      ) {
        cellClass += " is-today";
      }
      grid.appendChild(createElement("div", cellClass, String(date)));
    }

    var totalCells = 7 * 6 + 7;
    var filledCells = grid.children.length;
    var nextFillCount = totalCells - filledCells;
    for (var nextDay = 1; nextDay <= nextFillCount; nextDay += 1) {
      grid.appendChild(createElement("div", "calendar-cell is-muted", String(nextDay)));
    }

    container.appendChild(header);
    container.appendChild(grid);

    return {
      prevBtn: prevBtn,
      nextBtn: nextBtn,
      title: title
    };
  }

  app.calendar = {
    init: function () {
      var container = document.querySelector("[data-calendar]");
      if (!container) {
        return;
      }

      var currentDate = new Date();
      function render() {
        var controls = buildCalendar(container, currentDate);
        controls.prevBtn.addEventListener("click", function () {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
          render();
        });
        controls.nextBtn.addEventListener("click", function () {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          render();
        });
      }

      render();
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
