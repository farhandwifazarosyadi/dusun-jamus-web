/* karang-taruna.js - Karang Taruna public page */
(function (app) {
  "use strict";

  var FALLBACK_STRUCTURE_IMAGE_URL = "https://placehold.co/900x500?text=Struktur+Karang+Taruna";
  var FALLBACK_MEMBER_IMAGE_URL = "https://placehold.co/300x300?text=Anggota";

  function setStatusVisibility(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
  }

  function getKarangTarunaPositionRank(position) {
    var normalized = String(position || "").toLowerCase().trim();
    if (normalized === "ketua") {
      return 1;
    }
    if (normalized === "wakil ketua") {
      return 2;
    }
    if (normalized === "sekretaris") {
      return 3;
    }
    if (normalized === "bendahara") {
      return 4;
    }
    if (normalized.indexOf("anggota") !== -1) {
      return 999;
    }
    return 50;
  }

  function sortKarangTarunaMembers(members) {
    return (members || []).slice().sort(function (a, b) {
      var rankA = getKarangTarunaPositionRank(a && a.position);
      var rankB = getKarangTarunaPositionRank(b && b.position);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      var orderA = Number((a && a.sort_order) || 0);
      var orderB = Number((b && b.sort_order) || 0);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      var nameA = String((a && a.name) || "");
      var nameB = String((b && b.name) || "");
      return nameA.localeCompare(nameB);
    });
  }

  function createMemberCard(member) {
    var card = document.createElement("article");
    card.className = "karang-card";

    var image = document.createElement("div");
    image.className = "karang-photo";

    var img = document.createElement("img");
    img.src = member.photo_url || FALLBACK_MEMBER_IMAGE_URL;
    img.alt = member.name || "Anggota";
    image.appendChild(img);

    var name = document.createElement("h3");
    name.className = "karang-name";
    name.textContent = member.name || "Nama Anggota";

    var role = document.createElement("p");
    role.className = "karang-role";
    role.textContent = member.position || "Anggota";

    card.appendChild(image);
    card.appendChild(name);
    card.appendChild(role);

    return card;
  }

  function setInfoContent(info) {
    var title = document.querySelector("[data-karang-info-title]");
    var description = document.querySelector("[data-karang-info-description]");
    var image = document.querySelector("[data-karang-structure-image]");

    if (title && info && info.title) {
      title.textContent = info.title;
    }
    if (description) {
      if (info && info.description) {
        description.textContent = info.description;
      } else if (info && info.emptyMessage) {
        description.textContent = info.emptyMessage;
      }
    }
    if (image) {
      image.src = (info && info.structure_image_url) || FALLBACK_STRUCTURE_IMAGE_URL;
    }
  }

  async function loadInfo() {
    if (!app.supabase || typeof app.supabase.getKarangTarunaInformation !== "function") {
      setInfoContent(null);
      return { data: null, error: "Supabase helper belum tersedia." };
    }

    var response = await app.supabase.getKarangTarunaInformation();
    if (response.error) {
      setInfoContent({ emptyMessage: "Informasi Karang Taruna belum tersedia." });
      return response;
    }

    if (!response.data) {
      setInfoContent({ emptyMessage: "Informasi Karang Taruna belum tersedia." });
      return response;
    }

    setInfoContent(response.data || null);
    return response;
  }

  async function loadMembers() {
    var grid = document.querySelector("[data-karang-members]");
    var empty = document.querySelector("[data-karang-empty]");

    if (!grid) {
      return { data: [], error: null };
    }

    if (!app.supabase || typeof app.supabase.getKarangTarunaMembers !== "function") {
      setStatusVisibility(empty, true);
      return { data: [], error: "Supabase helper belum tersedia." };
    }

    var response = await app.supabase.getKarangTarunaMembers();
    if (response.error) {
      setStatusVisibility(empty, true);
      return response;
    }

    var members = sortKarangTarunaMembers(response.data || []);
    if (!members.length) {
      grid.innerHTML = "";
      setStatusVisibility(empty, true);
      return response;
    }

    grid.innerHTML = "";
    members.forEach(function (member) {
      grid.appendChild(createMemberCard(member));
    });
    setStatusVisibility(empty, false);
    return response;
  }

  app.karangTaruna = {
    init: async function () {
      await loadInfo();
      await loadMembers();
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
