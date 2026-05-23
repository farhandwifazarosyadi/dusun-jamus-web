/* navigation.js - Navigation and UI state */
(function () {
  "use strict";

  function normalizePath(pathname) {
    if (!pathname) {
      return "";
    }

    var clean = pathname.replace(/\\/g, "/");
    var parts = clean.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }

  function isHomePath(pathname) {
    var file = normalizePath(pathname);
    return !file || file === "index.html";
  }

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header") || document.querySelector(".navbar");
    var navToggle = document.querySelector(".nav-toggle") || document.querySelector(".navbar-toggle");
    var navMenu = document.querySelector(".site-nav") || document.querySelector(".nav-menu") || document.querySelector(".navbar-menu");
    var navLinks = toArray(document.querySelectorAll(".nav-link, .nav-menu a, .navbar-menu a"));
    var aboutSection = document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa");
    var isHome = isHomePath(window.location.pathname);
    var sectionMap = [
      {
        section: document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa"),
        aliases: ["#tentang-dusun", "#tentang-desa"]
      },
      {
        section: document.querySelector("#galeri-dusun") || document.querySelector("#galeri-desa"),
        aliases: ["#galeri-dusun", "#galeri-desa"]
      },
      {
        section: document.querySelector("#umkm"),
        aliases: ["#umkm"]
      },
      {
        section: document.querySelector("#karang-taruna"),
        aliases: ["#karang-taruna"]
      },
      {
        section: document.querySelector("#kontak"),
        aliases: ["#kontak"]
      }
    ].filter(function (item) {
      return !!item.section;
    });

    if (!header) {
      return;
    }

    function getHeaderHeight() {
      return header.offsetHeight || 72;
    }

    function updateHeaderState() {
      if (!isHome) {
        header.classList.add("is-sticky");
        return;
      }

      var threshold = aboutSection ? aboutSection.offsetTop - getHeaderHeight() : 0;
      header.classList.toggle("is-sticky", window.scrollY >= threshold);
    }

    function updateActiveNav() {
      if (!isHome) {
        return;
      }

      var offset = getHeaderHeight() + 80;
      var y = window.scrollY + offset;
      var activeSection = null;

      sectionMap.forEach(function (item) {
        var top = item.section.offsetTop;
        var bottom = top + item.section.offsetHeight;

        if (y >= top && y < bottom) {
          activeSection = item;
        }
      });

      navLinks.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var normalizedHref = href.replace("../index.html", "");
        var isActive = activeSection ? activeSection.aliases.indexOf(normalizedHref) !== -1 : false;

        link.classList.toggle("active", isActive);
        link.classList.toggle("is-active", isActive);
      });
    }

    function closeMobileMenu() {
      if (navMenu) {
        navMenu.classList.remove("is-open", "active", "show");
      }

      if (navToggle) {
        navToggle.classList.remove("is-open", "active");
        navToggle.setAttribute("aria-expanded", "false");
      }
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[href^='#']");

      if (!link) {
        return;
      }

      var href = link.getAttribute("href") || "";
      var target = document.querySelector(href);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      closeMobileMenu();
    });

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", function () {
        var isOpen = navMenu.classList.toggle("is-open");

        navToggle.classList.toggle("is-open", isOpen);
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    var ticking = false;

    function handleScrollState() {
      if (ticking) {
        return;
      }

      ticking = true;

      window.requestAnimationFrame(function () {
        updateHeaderState();
        updateActiveNav();
        ticking = false;
      });
    }

    window.addEventListener("scroll", handleScrollState, { passive: true });
    window.addEventListener("resize", function () {
      updateHeaderState();
      updateActiveNav();
    });

    updateHeaderState();
    updateActiveNav();
  });
})();
