/* umkm-catalog.js - Local catalog for UMKM detail page */
(function (app) {
  "use strict";

  var DUMMY_UMKM_CATALOG = [
    {
      umkmSlug: "keripik-singkong-jamus",
      title: "Keripik Singkong Original",
      description: "Keripik singkong renyah dengan rasa original.",
      price: "Rp15.000",
      imageUrl: "https://placehold.co/400x300?text=Produk+1"
    },
    {
      umkmSlug: "keripik-singkong-jamus",
      title: "Keripik Singkong Pedas",
      description: "Varian pedas untuk pecinta rasa kuat.",
      price: "Rp17.000",
      imageUrl: "https://placehold.co/400x300?text=Produk+2"
    }
  ];

  function setStatusVisibility(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
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

    if (item.imageUrl) {
      var img = document.createElement("img");
      img.src = item.imageUrl;
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

    if (item.price) {
      var price = document.createElement("p");
      price.className = "catalog-price";
      price.textContent = item.price;
      card.appendChild(price);
    }

    return card;
  }

  app.umkmCatalog = {
    init: function () {
      var section = document.querySelector("[data-umkm-catalog]");
      if (!section) {
        return;
      }

      var grid = section.querySelector("[data-umkm-catalog-grid]");
      var empty = section.querySelector("[data-umkm-catalog-empty]");

      if (!grid) {
        return;
      }

      var slug = getSlug();
      var items = DUMMY_UMKM_CATALOG.filter(function (item) {
        return item.umkmSlug === slug;
      });

      if (!items.length) {
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
