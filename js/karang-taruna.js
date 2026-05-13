/* karang-taruna.js - Local data for Karang Taruna page */
(function (app) {
  "use strict";

  var STRUCTURE_IMAGE_URL = "https://placehold.co/900x500?text=Struktur+Karang+Taruna";

  var DUMMY_KARANG_TARUNA = [
    {
      name: "Nama Ketua",
      role: "Ketua",
      photo: "https://placehold.co/300x300?text=Anggota"
    },
    {
      name: "Nama Wakil Ketua",
      role: "Wakil Ketua",
      photo: "https://placehold.co/300x300?text=Anggota"
    },
    {
      name: "Nama Sekretaris",
      role: "Sekretaris",
      photo: "https://placehold.co/300x300?text=Anggota"
    },
    {
      name: "Nama Bendahara",
      role: "Bendahara",
      photo: "https://placehold.co/300x300?text=Anggota"
    },
    {
      name: "Nama Seksi Kegiatan",
      role: "Seksi Kegiatan",
      photo: "https://placehold.co/300x300?text=Anggota"
    },
    {
      name: "Nama Seksi Humas",
      role: "Seksi Humas",
      photo: "https://placehold.co/300x300?text=Anggota"
    }
  ];

  function setStatusVisibility(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
  }

  function createMemberCard(member) {
    var card = document.createElement("article");
    card.className = "karang-card";

    var image = document.createElement("div");
    image.className = "karang-photo";

    var img = document.createElement("img");
    img.src = member.photo;
    img.alt = member.name;
    image.appendChild(img);

    var name = document.createElement("h3");
    name.className = "karang-name";
    name.textContent = member.name;

    var role = document.createElement("p");
    role.className = "karang-role";
    role.textContent = member.role;

    card.appendChild(image);
    card.appendChild(name);
    card.appendChild(role);

    return card;
  }

  app.karangTaruna = {
    init: function () {
      var image = document.querySelector("[data-karang-structure-image]");
      if (image) {
        image.src = STRUCTURE_IMAGE_URL;
      }

      var grid = document.querySelector("[data-karang-members]");
      var empty = document.querySelector("[data-karang-empty]");

      if (!grid) {
        return;
      }

      if (!DUMMY_KARANG_TARUNA.length) {
        setStatusVisibility(empty, true);
        return;
      }

      grid.innerHTML = "";
      DUMMY_KARANG_TARUNA.forEach(function (member) {
        grid.appendChild(createMemberCard(member));
      });
      setStatusVisibility(empty, false);
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
