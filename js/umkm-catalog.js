/* umkm-catalog.js - UMKM catalog for detail page */
(function (app) {
  "use strict";

  function setStatusVisibility(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
  }

  function setStatusMessage(element, message) {
    if (!element) {
      return;
    }
    element.textContent = message || "";
  }

  function getSlug() {
    var params = new URLSearchParams(window.location.search || "");
    return params.get("slug") || "";
  }

  function createCatalogCard(item) {
    var card = document.createElement("article");
    card.className = "catalog-card";

    var imageWrap = document.createElement("div");
    imageWrap.className = "catalog-image";

    if (item.image_url) {
      var img = document.createElement("img");
      img.src = item.image_url;
      img.alt = item.title;
      imageWrap.appendChild(img);
    } else {
      imageWrap.textContent = "Produk";
    }

    var title = document.createElement("h3");
    title.className = "catalog-title";
    title.textContent = item.title;

    var description = document.createElement("p");
    description.className = "catalog-desc";
    description.textContent = item.description;

    card.appendChild(imageWrap);
    card.appendChild(title);
    card.appendChild(description);

    if (item.price_text) {
      var price = document.createElement("p");
      price.className = "catalog-price";
      price.textContent = item.price_text;
      card.appendChild(price);
    }

    return card;
  }

  app.umkmCatalog = {
    init: async function () {
      var section = document.querySelector("[data-umkm-catalog]");
      if (!section) {
        return;
      }

      var grid = section.querySelector("[data-umkm-catalog-grid]");
      var empty = section.querySelector("[data-umkm-catalog-empty]");

      if (!grid) {
        return;
      }

      setStatusMessage(empty, "");
      setStatusVisibility(empty, false);

      var slug = getSlug();
      if (!slug) {
        setStatusMessage(empty, "Katalog produk belum tersedia.");
        setStatusVisibility(empty, true);
        return;
      }

      if (!app.supabase || typeof app.supabase.getUmkmBySlug !== "function") {
        setStatusMessage(empty, "Katalog produk gagal dimuat.");
        setStatusVisibility(empty, true);
        return;
      }

      var umkmResponse = await app.supabase.getUmkmBySlug(slug);
      if (umkmResponse.error || !umkmResponse.data) {
        setStatusMessage(empty, "Katalog produk belum tersedia.");
        setStatusVisibility(empty, true);
        return;
      }

      var catalogResponse = await app.supabase.getUmkmCatalogByUmkmId(umkmResponse.data.id);
      if (catalogResponse.error) {
        setStatusMessage(empty, "Katalog produk gagal dimuat.");
        setStatusVisibility(empty, true);
        return;
      }

      var items = catalogResponse.data || [];
      if (!items.length) {
        setStatusMessage(empty, "Katalog produk belum tersedia.");
        setStatusVisibility(empty, true);
        return;
      }

      grid.innerHTML = "";
      items.forEach(function (item) {
        grid.appendChild(createCatalogCard(item));
      });
      setStatusVisibility(empty, false);
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
