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

  function setupStickyTrigger(header) {
    if (!header || !isHomePath(window.location.pathname)) {
      return;
    }

    var aboutSection = document.querySelector("#tentang-desa") ||
      document.querySelector("#tentang-dusun");
    if (!aboutSection) {
      return;
    }

    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function getCurrentNavbarHeight() {
      var h = document.querySelector(".site-header") || document.querySelector(".navbar");
      return h ? h.offsetHeight : 72;
    }

    function smoothScrollToTarget(target, duration) {
      duration = typeof duration === "number" ? duration : 750;
      if (!target) return;
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

    function updateSticky() {
      var triggerTop = aboutSection.getBoundingClientRect().top + window.pageYOffset;
      var shouldStick = window.pageYOffset >= triggerTop - 8;
      var isSticky = header.classList.contains("is-sticky");
      if (shouldStick === isSticky) {
        return;
      }
      if (shouldStick && !isSticky) {
        var preHeight = header.getBoundingClientRect().height;
        document.body.style.paddingTop = preHeight + "px";
        header.classList.add("is-sticky");
        document.body.classList.add("navbar-sticky");
      } else if (!shouldStick && isSticky) {
        header.classList.remove("is-sticky");
        document.body.classList.remove("navbar-sticky");
        document.body.style.paddingTop = "";
      }
    }

    updateSticky();
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            updateSticky();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      // handle resize immediately to recalc trigger
      updateSticky();
    });
  }

  app.navigation = {
    init: function () {
      var toggle = document.querySelector("[data-nav-toggle]");
      var menu = document.querySelector("[data-nav-menu]");
      var links = toArray(document.querySelectorAll("[data-nav-link]"));
      var header = document.querySelector(".site-header");

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
        // use custom RAF-based smooth scroll to avoid native roughness
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
      setupStickyTrigger(header);
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
