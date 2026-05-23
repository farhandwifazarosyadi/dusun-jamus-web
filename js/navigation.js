/* navigation.js - Navigation and UI state */
(function (app) {
  "use strict";

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

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

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getNavbarElement() {
    return document.querySelector(".site-header") || document.querySelector(".navbar");
  }

  function ensureNavbarSpacer(navbar) {
    var spacer = document.querySelector(".navbar-spacer");

    if (!spacer && navbar && navbar.parentNode) {
      spacer = document.createElement("div");
      spacer.className = "navbar-spacer";
      spacer.setAttribute("aria-hidden", "true");
      navbar.parentNode.insertBefore(spacer, navbar.nextSibling);
    }

    return spacer;
  }

  function getCurrentNavbarHeight() {
    var navbar = getNavbarElement();
    return navbar ? navbar.offsetHeight : 72;
  }

  function getSectionMap() {
    return [
      {
        links: ["a[href=\"#tentang-dusun\"]", "a[href=\"#tentang-desa\"]"],
        section: document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa")
      },
      {
        links: ["a[href=\"#galeri-dusun\"]", "a[href=\"#galeri-desa\"]"],
        section: document.querySelector("#galeri-dusun") || document.querySelector("#galeri-desa")
      },
      {
        links: ["a[href=\"#umkm\"]"],
        section: document.querySelector("#umkm")
      },
      {
        links: ["a[href=\"#karang-taruna\"]"],
        section: document.querySelector("#karang-taruna")
      },
      {
        links: ["a[href=\"#kontak\"]"],
        section: document.querySelector("#kontak")
      }
    ];
  }

  function clearActiveNavLinks() {
    document.querySelectorAll(".nav-link, .navbar a, .nav-menu a").forEach(function (link) {
      link.classList.remove("active", "is-active");
    });
  }

  function setActiveLinks(selectors) {
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (link) {
        link.classList.add("active", "is-active");
      });
    });
  }
/* navigation.js - Navigation and UI state */
(function (app) {
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

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header") || document.querySelector(".navbar");
    var navToggle = document.querySelector(".nav-toggle") || document.querySelector(".navbar-toggle");
    var navMenu = document.querySelector(".nav-menu") || document.querySelector(".navbar-menu");
    var navLinks = document.querySelectorAll(".nav-link, .nav-menu a, .navbar-menu a");
    var triggerSection = document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa");

    if (!header) {
      return;
    }

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
        section: document.querySelector("#kontak"),
        aliases: ["#kontak"]
      }
    ].filter(function (item) {
      return !!item.section;
    });

    function getHeaderHeight() {
      return header.offsetHeight || 72;
    }

    function updateStickyNavbar() {
      if (!triggerSection) {
        return;
      }

      var shouldStick = window.scrollY >= triggerSection.offsetTop;
      header.classList.toggle("is-sticky", shouldStick);
    }

    function updateActiveNav() {
      if (!isHomePath(window.location.pathname)) {
        return;
      }

      var offset = getHeaderHeight() + 80;
      var y = window.scrollY + offset;
      var active = null;

      sectionMap.forEach(function (item) {
        var top = item.section.offsetTop;
        var bottom = top + item.section.offsetHeight;

        if (y >= top && y < bottom) {
          active = item;
        }
      });

      navLinks.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var normalizedHref = href.replace("../index.html", "");
        var isActive = active ? active.aliases.indexOf(normalizedHref) !== -1 : false;

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
      }
    }

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";

      if (!href.startsWith("#")) {
        return;
      }

      link.addEventListener("click", function (event) {
        var target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();

        var targetY = target.offsetTop - getHeaderHeight() - 8;
        window.scrollTo({
          top: targetY,
          behavior: "smooth"
        });

        closeMobileMenu();
      });
    });

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", function () {
        navMenu.classList.toggle("is-open");
        navToggle.classList.toggle("is-open");
      });
    }

    var ticking = false;

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) {
          return;
        }

        ticking = true;

        requestAnimationFrame(function () {
          updateStickyNavbar();
          updateActiveNav();
          ticking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      updateStickyNavbar();
      updateActiveNav();
    });

    updateStickyNavbar();
    updateActiveNav();
  });
})(window.DusunJamus = window.DusunJamus || {});
    if (window.__navbarStickyBound) {
