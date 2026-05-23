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

  function smoothScrollToTarget(target, duration) {
    duration = typeof duration === "number" ? duration : 750;
    if (!target) {
      return;
    }

    var navbarHeight = getCurrentNavbarHeight();
    var targetY = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
    var startY = window.scrollY;
    var distance = targetY - startY;
    var startTime = performance.now();

    function step(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  var navbarInitialTop = 0;
  var navbarHeight = 0;
  var navbarIsSticky = false;
  var ticking = false;

  function calculateNavbarStickyPoint() {
    var navbar = getNavbarElement();
    if (!navbar) {
      navbarInitialTop = 0;
      return;
    }

    var wasSticky = navbar.classList.contains("is-sticky");
    navbar.classList.remove("is-sticky");

    var rect = navbar.getBoundingClientRect();
    navbarInitialTop = rect.top + window.scrollY;
    navbarHeight = navbar.offsetHeight;

    if (wasSticky) {
      navbar.classList.add("is-sticky");
    }

    var spacer = ensureNavbarSpacer(navbar);
    if (spacer) {
      spacer.style.height = navbarIsSticky ? navbarHeight + "px" : "0px";
    }
  }

  function updateNavbarSticky() {
    var navbar = getNavbarElement();
    if (!navbar || !navbarInitialTop) {
      return;
    }

    var shouldStick = window.scrollY >= navbarInitialTop;
    if (shouldStick === navbarIsSticky) {
      return;
    }

    navbarIsSticky = shouldStick;
    navbar.classList.toggle("is-sticky", navbarIsSticky);

    var spacer = ensureNavbarSpacer(navbar);
    if (spacer) {
      spacer.style.height = navbarIsSticky ? navbarHeight + "px" : "0px";
    }
  }

  function onScroll() {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(function () {
      updateNavbarSticky();
      ticking = false;
    });
  }

  function setActiveLink(links, target) {
    links.forEach(function (link) {
      link.classList.toggle("is-active", link === target);
    });
  }

  function findLinkByHref(links, href) {
    return links.find(function (link) {
      return link.getAttribute("href") === href;
    });
  }

  function updateActiveState(links) {
    if (!links.length) {
      return;
    }

    var hash = window.location.hash;
    var file = normalizePath(window.location.pathname);

    if (hash) {
      var hashLink = findLinkByHref(links, hash);
      if (hashLink) {
        setActiveLink(links, hashLink);
        return;
      }
    }

    if (isHomePath(window.location.pathname)) {
      var homeLink =
        findLinkByHref(links, "#tentang-desa") ||
        findLinkByHref(links, "#hero") ||
        findLinkByHref(links, "index.html");
      if (homeLink) {
        setActiveLink(links, homeLink);
      }
      return;
    }

    if (file) {
      var match = links.find(function (link) {
        return normalizePath(link.getAttribute("href")) === file;
      });
      if (match) {
        setActiveLink(links, match);
      }
    }
  }

  function setupScrollSpy(links) {
    if (!links.length || !isHomePath(window.location.pathname)) {
      return;
    }

    var sections = links
      .map(function (link) {
        var href = link.getAttribute("href") || "";
        if (href.charAt(0) !== "#") {
          return null;
        }
        var section = document.querySelector(href);
        if (!section) {
          return null;
        }
        return { link: link, section: section };
      })
      .filter(Boolean);

    if (!sections.length) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          });

        if (!visible.length) {
          return;
        }

        var activeId = visible[0].target.getAttribute("id");
        var activeLink = sections.find(function (item) {
          return item.section.getAttribute("id") === activeId;
        });
        if (activeLink) {
          setActiveLink(links, activeLink.link);
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0.25, 0.5, 0.75]
      }
    );

    sections.forEach(function (item) {
      observer.observe(item.section);
    });
  }

  function setupStickyTrigger(navbar) {
    if (!navbar || !isHomePath(window.location.pathname)) {
      return;
    }

    if (window.__navbarStickyBound) {
      return;
    }
    window.__navbarStickyBound = true;

    calculateNavbarStickyPoint();
    updateNavbarSticky();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      calculateNavbarStickyPoint();
      updateNavbarSticky();
    });
    window.addEventListener("load", function () {
      calculateNavbarStickyPoint();
      updateNavbarSticky();
    });
  }

  app.navigation = {
    init: function () {
      var toggle = document.querySelector("[data-nav-toggle]");
      var menu = document.querySelector("[data-nav-menu]");
      var links = toArray(document.querySelectorAll("[data-nav-link]"));
      var navbar = getNavbarElement();

      if (toggle && menu) {
        toggle.addEventListener("click", function () {
          var isOpen = menu.classList.toggle("is-open");
          toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
      }

      document.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (!link) {
          return;
        }

        var href = link.getAttribute("href");
        if (!href || href.charAt(0) !== "#") {
          if (menu) {
            menu.classList.remove("is-open");
          }
          return;
        }

        var target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();
        smoothScrollToTarget(target, 700);
        history.replaceState(null, "", href);
        var hashLink = findLinkByHref(links, href);
        if (hashLink) {
          setActiveLink(links, hashLink);
        }
        if (menu) {
          menu.classList.remove("is-open");
        }
      });

      window.addEventListener("hashchange", function () {
        updateActiveState(links);
      });

      updateActiveState(links);
      setupScrollSpy(links);
      setupStickyTrigger(navbar);
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
