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

  app.navigation = {
    init: function () {
      var toggle = document.querySelector("[data-nav-toggle]");
      var menu = document.querySelector("[data-nav-menu]");
      var links = toArray(document.querySelectorAll("[data-nav-link]"));

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
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
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

  app.navigation = {
    init: function () {
      var toggle = document.querySelector("[data-nav-toggle]");
      var menu = document.querySelector("[data-nav-menu]");
      var links = toArray(document.querySelectorAll("[data-nav-link]"));

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
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
