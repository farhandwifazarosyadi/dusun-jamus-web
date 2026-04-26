/* gallery.js - Gallery section slider and data */
(function (app) {
  "use strict";

  function pickValue(item, keys) {
    if (!item) {
      return "";
    }
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(item, key) && item[key]) {
        return String(item[key]);
      }
    }
    return "";
  }

  function createSlide(item, label) {
    var slide = document.createElement("article");
    slide.className = "gallery-slide";

    var card = document.createElement("div");
    card.className = "gallery-card";

    if (item && item.imageUrl) {
      var img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = item.title || label;
      card.textContent = "";
      card.appendChild(img);

      var body = document.createElement("div");
      body.className = "gallery-card-body";

      var title = document.createElement("h3");
      title.className = "gallery-card-title";
      title.textContent = item.title || label;
      body.appendChild(title);

      if (item.description) {
        var desc = document.createElement("p");
        desc.className = "gallery-card-desc";
        desc.textContent = item.description;
        body.appendChild(desc);
      }

      card.appendChild(body);
    } else {
      card.textContent = label;
    }

    slide.appendChild(card);
    return slide;
  }

  function updateNavState(track, prevButton, nextButton) {
    if (!track || !prevButton || !nextButton) {
      return;
    }
    var maxScrollLeft = track.scrollWidth - track.clientWidth;
    prevButton.disabled = track.scrollLeft <= 0;
    nextButton.disabled = track.scrollLeft >= maxScrollLeft - 1;
  }

  function getScrollAmount(track) {
    if (!track) {
      return 0;
    }
    var slide = track.querySelector(".gallery-slide");
    if (!slide) {
      return track.clientWidth * 0.8;
    }
    var slideWidth = slide.getBoundingClientRect().width;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || 0);
    return slideWidth + (isNaN(gap) ? 0 : gap);
  }

  function renderFallback(track, fallback) {
    if (!track) {
      return;
    }
    if (fallback) {
      fallback.classList.remove("is-hidden");
    }
  }

  function renderGallery(track, items, fallback) {
    if (!track) {
      return;
    }
    if (!items || !items.length) {
      renderFallback(track, fallback);
      return;
    }

    if (fallback) {
      fallback.classList.add("is-hidden");
    }

    track.innerHTML = "";
    items.forEach(function (item, index) {
      var title = item.title || "Foto Desa";
      var slide = createSlide(item, title || "Foto Desa");
      slide.setAttribute("data-index", String(index));
      track.appendChild(slide);
    });
  }

  app.gallery = {
    init: async function () {
      var section = document.querySelector(".gallery-section");
      if (!section) {
        return;
      }

      var track = section.querySelector("[data-gallery-track]");
      var prevButton = section.querySelector("[data-gallery-prev]");
      var nextButton = section.querySelector("[data-gallery-next]");
      var fallback = section.querySelector("[data-gallery-fallback]");

      if (prevButton && nextButton && track) {
        prevButton.addEventListener("click", function () {
          track.scrollBy({ left: -getScrollAmount(track), behavior: "smooth" });
        });
        nextButton.addEventListener("click", function () {
          track.scrollBy({ left: getScrollAmount(track), behavior: "smooth" });
        });

        track.addEventListener("scroll", function () {
          updateNavState(track, prevButton, nextButton);
        });

        updateNavState(track, prevButton, nextButton);
      }

      if (!app.supabase || typeof app.supabase.getActiveGalleryItems !== "function") {
        renderFallback(track, fallback);
        return;
      }

      try {
        var response = await app.supabase.getActiveGalleryItems(9);
        if (!response || response.error) {
          console.warn("Galeri desa belum tersedia.", response ? response.error : "");
          renderFallback(track, fallback);
          return;
        }

        var items = (response.data || []).map(function (item) {
          var imageUrl = pickValue(item, ["image_url", "imageUrl", "photo_url", "thumbnail_url"]);
          return {
            title: pickValue(item, ["title", "name", "caption"]) || "Foto Desa",
            description: pickValue(item, ["description", "desc", "detail"]) || "",
            imageUrl: imageUrl
          };
        });

        renderGallery(track, items, fallback);
        updateNavState(track, prevButton, nextButton);
      } catch (error) {
        console.warn("Gagal memuat galeri desa.", error);
        renderFallback(track, fallback);
      }
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
