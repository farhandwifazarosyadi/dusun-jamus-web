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
    link.href = "pages/potensi.html";
    link.textContent = "Detail";

    card.appendChild(image);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(link);
    return card;
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
        return true;
      });

      if (!grid || !items.length) {
        setStatusVisibility(empty, true);
        return;
      }

      grid.innerHTML = "";
      items.slice(0, 6).forEach(function (item) {
        grid.appendChild(createCard(item));
      });
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
