/* maps.js - Google Maps integration and contact data */
(function (app) {
  "use strict";

  function updateMapPlaceholder(text) {
    var container = document.querySelector("[data-contact-map]");
    if (!container) {
      return;
    }
    container.textContent = text;
  }

  function updateContactText(selector, text) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  function updateContactStatus(visible) {
    var status = document.querySelector("[data-contact-status]");
    if (status) {
      status.classList.toggle("is-hidden", !visible);
    }
  }

  function renderSocialLinks(container, items) {
    if (!container) {
      return;
    }
    var list = container.querySelector("ul");
    if (!list) {
      return;
    }
    list.innerHTML = "";
    if (!items || !items.length) {
      list.innerHTML = "<li>-</li>";
      return;
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = item.url || "#";
      link.textContent = item.label || "Social";
      link.target = "_blank";
      link.rel = "noopener";
      li.appendChild(link);
      list.appendChild(li);
    });
  }

  function renderContactMap(container, apiKey, query, lat, lng) {
    if (!container) {
      return;
    }
    if (!apiKey) {
      container.innerHTML = "<p>Peta belum tersedia.</p>";
      return;
    }

    var q = query || "Dusun Jamus";
    if (lat && lng) {
      q = lat + "," + lng;
    }

    var src = "https://www.google.com/maps/embed/v1/place?key=" +
      encodeURIComponent(apiKey) + "&q=" + encodeURIComponent(q);

    container.innerHTML = "<iframe loading=\"lazy\" allowfullscreen referrerpolicy=\"no-referrer-when-downgrade\" src=\"" + src + "\"></iframe>";
  }

  async function fetchContactData(client) {
    try {
      var contacts = await client.from("site_contacts").select("*").limit(1);
      var socials = await client.from("site_social_links").select("*");
      return {
        contact: contacts.data && contacts.data[0] ? contacts.data[0] : null,
        socials: socials.data || [],
        error: contacts.error || socials.error || null
      };
    } catch (error) {
      return { contact: null, socials: [], error: error.message };
    }
  }

  app.maps = {
    init: async function () {
      var apiKey = app.config && typeof app.config.get === "function"
        ? app.config.get("googleMapsApiKey")
        : "";

      if (!apiKey) {
        updateMapPlaceholder("Lokasi: Dusun Jamus. Peta belum tersedia.");
      }

      var contactSection = document.querySelector("[data-contact-section]");
      if (!contactSection) {
        if (!apiKey) {
          console.warn("Google Maps API key belum diisi.");
        }
        return;
      }

      updateContactStatus(true);

      if (!app.supabase || typeof app.supabase.initClient !== "function") {
        updateContactStatus(false);
        return;
      }

      var client = app.supabase.initClient();
      if (!client) {
        updateContactStatus(false);
        return;
      }

      var response = await fetchContactData(client);
      updateContactStatus(false);

      if (response.error) {
        console.warn("Kontak belum tersedia.", response.error);
      }

      var contact = response.contact || {};
      var socials = response.socials || [];
      var address = contact.address || contact.alamat || "-";
      var phone = contact.phone || contact.telepon || contact.whatsapp || "-";
      var email = contact.email || "-";
      var description = contact.description || contact.keterangan || "Informasi kontak Dusun Jamus.";
      var lat = contact.latitude || contact.lat || "";
      var lng = contact.longitude || contact.lng || "";

      updateContactText("[data-contact-description]", description);
      updateContactText("[data-contact-address]", "Alamat: " + address);
      updateContactText("[data-contact-phone]", "Telepon/WA: " + phone);
      updateContactText("[data-contact-email]", "Email: " + email);

      renderSocialLinks(document.querySelector("[data-contact-socials]"), socials.map(function (item) {
        return {
          label: item.label || item.platform || "Social",
          url: item.url || item.link || "#"
        };
      }));

      app.contact = {
        address: address,
        lat: lat,
        lng: lng
      };

      renderContactMap(document.querySelector("[data-contact-map]"), apiKey, address, lat, lng);
    },
    renderPreview: function () {
      return;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
