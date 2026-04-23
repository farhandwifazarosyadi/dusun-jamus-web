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

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function buildDetailUrl(item) {
    var slug = pickValue(item, ["slug"], "");
    var id = pickValue(item, ["id"], "");
    if (!slug) {
      slug = slugify(pickValue(item, ["title", "name"], ""));
    }
    if (slug) {
      return "pages/umkm-detail.html?slug=" + encodeURIComponent(slug);
    }
    if (id) {
      return "pages/umkm-detail.html?id=" + encodeURIComponent(id);
    }
    return "pages/umkm-detail.html";
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
    title.textContent = pickValue(item, ["title", "name"], "UMKM");

    var desc = document.createElement("p");
    desc.className = "potential-desc";
    desc.textContent = pickValue(item, ["description", "summary", "ringkasan"], "Deskripsi singkat UMKM.");

    var link = document.createElement("a");
    link.className = "potential-link";
    link.href = buildDetailUrl(item);
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

  function renderDetailItem(section, item) {
    if (!section || !item) {
      setDetailStatus(section, false, true);
      return;
    }

    var title = section.querySelector("[data-detail-title]");
    var description = section.querySelector("[data-detail-description]");
    var image = section.querySelector("[data-detail-image]");

    if (title) {
      title.textContent = pickValue(item, ["title", "name"], "Nama UMKM");
    }
    if (description) {
      description.textContent = pickValue(
        item,
        ["full_description", "description", "summary", "ringkasan"],
        "Deskripsi lengkap UMKM."
      );
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

  function getQueryParams() {
    return new URLSearchParams(window.location.search || "");
  }

  async function loadDetailPage(section) {
    if (!section) {
      return;
    }

    setDetailStatus(section, true, false);
    var params = getQueryParams();
    var slug = params.get("slug") || "";
    var id = params.get("id") || "";

    if (!app.supabase) {
      setDetailStatus(section, false, true);
      return;
    }

    try {
      var response = null;
      if (slug) {
        response = await app.supabase.getPotentialBySlug(slug);
      } else if (id) {
        response = await app.supabase.getUmkmItemById(id);
      }

      if (!response || response.error || !response.data) {
        setDetailStatus(section, false, true);
        return;
      }

      if (normalizeType(response.data) !== "umkm") {
        setDetailStatus(section, false, true);
        return;
      }

      renderDetailItem(section, response.data);
    } catch (error) {
      console.warn("Detail UMKM gagal dimuat.", error);
      setDetailStatus(section, false, true);
    }
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
      var detailSection = document.querySelector("[data-umkm-detail]");
      if (!section && !detailSection) {
        return;
      }

      if (detailSection) {
        await loadDetailPage(detailSection);
      }

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

      grid.innerHTML = "";
      items.slice(0, 6).forEach(function (item, index) {
        grid.appendChild(createCardWithDetail(item, index, false));
      });
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
