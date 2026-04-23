/* potentials.js - UMKM and potential items preview */
(function (app) {
  "use strict";

  function pickValue(item, keys, fallback) {
    if (!item) {
      return fallback || "";
    }
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(item, key) && item[key]) {
        return String(item[key]);
      }
    }
    return fallback || "";
  }

  function setStatusVisibility(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
  }

  function createCard(item) {
    return createCardWithDetail(item, -1, false);
  }

  function createCardWithDetail(item, index, useDetailSection) {
    var card = document.createElement("article");
    card.className = "potential-card";

    var image = document.createElement("div");
    image.className = "potential-image";

    var imageUrl = pickValue(item, ["image_url", "imageUrl", "photo_url", "thumbnail_url"], "");
    if (imageUrl) {
      var img = document.createElement("img");
      img.src = imageUrl;
      img.alt = pickValue(item, ["title", "name"], "UMKM");
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "18px";
      image.textContent = "";
      image.appendChild(img);
    } else {
      image.textContent = pickValue(item, ["title", "name"], "UMKM");
    }

    var title = document.createElement("h3");
    title.className = "potential-title";
    title.textContent = pickValue(item, ["title", "name"], "Produk UMKM");

    var desc = document.createElement("p");
    desc.className = "potential-desc";
    desc.textContent = pickValue(item, ["description", "summary", "ringkasan"], "Deskripsi singkat UMKM.");

    var link = document.createElement("a");
    link.className = "potential-link";
    if (useDetailSection && index >= 0) {
      link.href = "#detail-umkm";
      link.setAttribute("data-detail-index", String(index));
    } else {
      link.href = "pages/potensi.html";
    }
    link.textContent = "Detail UMKM";

    card.appendChild(image);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(link);
    return card;
  }

  function normalizeType(item) {
    var type = pickValue(item, ["type", "kategori", "category"], "");
    return String(type || "").toLowerCase();
  }

  function setDetailStatus(section, loadingVisible, emptyVisible) {
    if (!section) {
      return;
    }
    setStatusVisibility(section.querySelector("[data-detail-loading]"), loadingVisible);
    setStatusVisibility(section.querySelector("[data-detail-empty]"), emptyVisible);
  }

  function renderDetail(section, items, index) {
    if (!section || !items.length) {
      setDetailStatus(section, false, true);
      return;
    }

    var safeIndex = index;
    if (safeIndex < 0 || safeIndex >= items.length) {
      safeIndex = 0;
    }

    var item = items[safeIndex];
    var title = section.querySelector("[data-detail-title]");
    var description = section.querySelector("[data-detail-description]");
    var price = section.querySelector("[data-detail-price]");
    var contact = section.querySelector("[data-detail-contact]");
    var image = section.querySelector("[data-detail-image]");

    if (title) {
      title.textContent = pickValue(item, ["title", "name"], "Nama UMKM");
    }
    if (description) {
      description.textContent = pickValue(item, ["description", "summary", "ringkasan"], "Deskripsi lengkap UMKM.");
    }
    if (price) {
      price.textContent = "Harga: " + pickValue(item, ["price", "harga"], "-");
    }
    if (contact) {
      contact.textContent = "Kontak: " + pickValue(item, ["contact", "kontak", "phone", "telepon"], "-");
    }

    if (image) {
      var imageUrl = pickValue(item, ["image_url", "imageUrl", "photo_url", "thumbnail_url"], "");
      image.innerHTML = "";
      if (imageUrl) {
        var img = document.createElement("img");
        img.src = imageUrl;
        img.alt = pickValue(item, ["title", "name"], "UMKM");
        image.appendChild(img);
      } else {
        image.textContent = pickValue(item, ["title", "name"], "Gambar UMKM");
      }
    }

    setDetailStatus(section, false, false);
  }

  async function fetchPotentialItems() {
    if (!app.supabase || typeof app.supabase.initClient !== "function") {
      return { data: [], error: "Supabase client belum siap." };
    }

    var client = app.supabase.initClient();
    if (!client) {
      return { data: [], error: "Supabase client belum siap." };
    }

    try {
      var response = await client.from("potential_items").select("*");
      if (response.error) {
        return { data: [], error: response.error.message };
      }
      return { data: response.data || [], error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  app.potentials = {
    init: async function () {
      var section = document.querySelector(".potentials-section");
      if (!section) {
        return;
      }

      var grid = section.querySelector("[data-potentials-grid]");
      var loading = section.querySelector("[data-potentials-loading]");
      var empty = section.querySelector("[data-potentials-empty]");

      setStatusVisibility(loading, true);
      setStatusVisibility(empty, false);

      var response = await fetchPotentialItems();
      setStatusVisibility(loading, false);

      if (!response || response.error) {
        console.warn("Data UMKM belum tersedia.", response ? response.error : "");
        setStatusVisibility(empty, true);
        return;
      }

      var items = (response.data || []).filter(function (item) {
        return normalizeType(item) === "umkm";
      });

      if (!grid || !items.length) {
        setStatusVisibility(empty, true);
        return;
      }

      var detailSection = document.querySelector("[data-detail-section]");
      var useDetailSection = Boolean(detailSection);

      grid.innerHTML = "";
      items.slice(0, 6).forEach(function (item, index) {
        grid.appendChild(createCardWithDetail(item, index, useDetailSection));
      });

      if (useDetailSection) {
        var currentIndex = 0;
        var prevButton = detailSection.querySelector("[data-detail-prev]");
        var nextButton = detailSection.querySelector("[data-detail-next]");

        var selectIndex = function (nextIndex) {
          currentIndex = nextIndex;
          renderDetail(detailSection, items, currentIndex);
        };

        if (prevButton) {
          prevButton.addEventListener("click", function () {
            var next = currentIndex - 1;
            if (next < 0) {
              next = items.length - 1;
            }
            selectIndex(next);
          });
        }

        if (nextButton) {
          nextButton.addEventListener("click", function () {
            var next = currentIndex + 1;
            if (next >= items.length) {
              next = 0;
            }
            selectIndex(next);
          });
        }

        grid.addEventListener("click", function (event) {
          var link = event.target.closest("[data-detail-index]");
          if (!link) {
            return;
          }
          var nextIndex = parseInt(link.getAttribute("data-detail-index"), 10);
          if (isNaN(nextIndex)) {
            return;
          }
          event.preventDefault();
          detailSection.classList.remove("is-hidden");
          setDetailStatus(detailSection, true, false);
          selectIndex(nextIndex);
          if (detailSection && typeof detailSection.scrollIntoView === "function") {
            detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
