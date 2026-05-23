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
    var navMenu = document.querySelector(".nav-menu") || document.querySelector(".navbar-menu") || document.querySelector("[data-nav-menu]");
    var navLinks = document.querySelectorAll(".nav-link, .nav-menu a, .navbar-menu a, [data-nav-link]");
    var triggerSection = document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa");
    var sections = [
      document.querySelector("#tentang-dusun") || document.querySelector("#tentang-desa"),
      document.querySelector("#galeri-dusun") || document.querySelector("#galeri-desa"),
      document.querySelector("#umkm"),
      document.querySelector("#karang-taruna"),
      document.querySelector("#kontak")
    ].filter(Boolean);

    if (!header) {
      return;
    }

    function getHeaderHeight() {
      return header.offsetHeight || 72;
    }

    function updateStickyNavbar() {
      if (!triggerSection) {
        return;
      }

      var triggerTop = triggerSection.offsetTop;
      var shouldStick = window.scrollY >= triggerTop;

      header.classList.toggle("is-sticky", shouldStick);
    }

    function clearActiveNavLinks() {
      document.querySelectorAll(".nav-link, .navbar a, .nav-menu a, [data-nav-link]").forEach(function (link) {
        link.classList.remove("active", "is-active");
      });
    }

    function updatePageActiveState() {
      if (isHomePath(window.location.pathname)) {
        return;
      }

      var currentFile = normalizePath(window.location.pathname);

      clearActiveNavLinks();

      navLinks.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        if (!href || href.charAt(0) === "#") {
          return;
        }

        if (normalizePath(href.replace("../index.html", "index.html")) === currentFile) {
          link.classList.add("active", "is-active");
        }
      });
    }

    function setActiveLinks(selectors) {
      selectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (link) {
          link.classList.add("active", "is-active");
        });
      });
    }

    function updateActiveNav() {
      if (!isHomePath(window.location.pathname)) {
        return;
      }

      var offset = getHeaderHeight() + 60;
      var scrollY = window.scrollY + offset;
      var currentId = "";

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var bottom = top + section.offsetHeight;

        if (scrollY >= top && scrollY < bottom) {
          currentId = section.id;
        }
      });

      clearActiveNavLinks();

      if (!currentId) {
        return;
      }

      setActiveLinks([
        'a[href="#' + currentId + '"]',
        currentId === "tentang-dusun" ? 'a[href="#tentang-desa"]' : "",
        currentId === "tentang-desa" ? 'a[href="#tentang-dusun"]' : "",
        currentId === "galeri-dusun" ? 'a[href="#galeri-desa"]' : "",
        currentId === "galeri-desa" ? 'a[href="#galeri-dusun"]' : ""
      ].filter(Boolean));
    }

    function closeMobileMenu() {
      if (navMenu) {
        navMenu.classList.remove("is-open", "active", "show");
      }
      if (navToggle) {
        navToggle.classList.remove("is-open", "active");
      }
    }

    function scrollToSection(target) {
      if (!target) {
        return;
      }

      var y = target.offsetTop - getHeaderHeight() - 8;

      window.scrollTo({
        top: y,
        behavior: "smooth"
      });
    }

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) {
        return;
      }

      link.addEventListener("click", function (event) {
        var target = document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();
        scrollToSection(target);
        closeMobileMenu();
      });
    });

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", function () {
        navMenu.classList.toggle("is-open");
        navToggle.classList.toggle("is-open");
      });
    }

    var scrollTicking = false;

    function handleScroll() {
      if (scrollTicking) {
        return;
      }

      scrollTicking = true;

      requestAnimationFrame(function () {
        updateStickyNavbar();
        updateActiveNav();
        scrollTicking = false;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", function () {
      updateStickyNavbar();
      updateActiveNav();
      updatePageActiveState();
    });

    updateStickyNavbar();
    updateActiveNav();
    updatePageActiveState();
  });
})(window.DusunJamus = window.DusunJamus || {});
    if (window.__navbarStickyBound) {
