/* maps.js - Leaflet + OpenStreetMap integration and contact data */
(function (app) {
  "use strict";

  var locationConfig = app.config && app.config.location ? app.config.location : null;
  var defaultLat = locationConfig && typeof locationConfig.latitude === "number"
    ? locationConfig.latitude
    : -7.83552;
  var defaultLng = locationConfig && typeof locationConfig.longitude === "number"
    ? locationConfig.longitude
    : 110.17035;
  var defaultAddress = locationConfig && locationConfig.fullAddress
    ? locationConfig.fullAddress
    : "Dusun Jamus, Kecamatan Pengasih, Kabupaten Kulon Progo, DIY";
  var defaultName = locationConfig && locationConfig.name ? locationConfig.name : "Dusun Jamus";
  var forbiddenAddressTerms = ["wonogiri", "slogohimo", "jawa tengah"];

  function updateMapPlaceholder(text) {
    var container = document.querySelector("[data-contact-map]");
    if (!container) {
      return;
    }
    container.innerHTML = "<p>" + text + "</p>";
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

  function setPlacesVisibility(visible) {
    var card = document.querySelector("[data-places-card]");
    if (card) {
      card.classList.toggle("is-hidden", !visible);
    }
  }

  function renderPlacesList(items) {
    var list = document.querySelector("[data-places-list]");
    if (!list) {
      return;
    }
    list.innerHTML = "";
    if (!items || !items.length) {
      setPlacesVisibility(false);
      return;
    }
    setPlacesVisibility(true);
    items.forEach(function (item) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.className = "places-name";
      name.textContent = item.name || "Tempat";
      li.appendChild(name);
      if (item.distance) {
        var meta = document.createElement("span");
        meta.className = "places-meta";
        meta.textContent = " " + item.distance;
        li.appendChild(meta);
      }
      list.appendChild(li);
    });
  }

  function isValidCoordinate(value, min, max) {
    if (value === null || value === undefined || value === "") {
      return false;
    }
    var numeric = typeof value === "number" ? value : parseFloat(value);
    if (!Number.isFinite(numeric)) {
      return false;
    }
    return numeric >= min && numeric <= max;
  }

  function isForbiddenAddress(text) {
    if (!text) {
      return false;
    }
    var normalized = String(text).toLowerCase();
    return forbiddenAddressTerms.some(function (term) {
      return normalized.indexOf(term) !== -1;
    });
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
      link.rel = "noopener noreferrer";
      li.appendChild(link);
      list.appendChild(li);
    });
  }

  function renderContactMap(container, label, lat, lng) {
    if (!container) {
      return;
    }

    if (!window.L) {
      updateMapPlaceholder("Lokasi: " + defaultAddress + ". Peta belum tersedia.");
      return;
    }

    var center = [
      isValidCoordinate(lat, -90, 90) ? parseFloat(lat) : defaultLat,
      isValidCoordinate(lng, -180, 180) ? parseFloat(lng) : defaultLng
    ];
    var popupText = label || defaultAddress;

    container.innerHTML = "<div class=\"map-canvas\" aria-label=\"Peta Dusun Jamus\"></div>";
    var canvas = container.querySelector(".map-canvas");
    if (!canvas) {
      updateMapPlaceholder("Peta belum tersedia.");
      return;
    }

    var map = window.L.map(canvas, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(center, 15);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    window.L.marker(center)
      .addTo(map)
      .bindPopup(popupText)
      .openPopup();
  }

  async function searchNearbyPlaces(apiKey, lat, lng) {
    if (!apiKey) {
      setPlacesVisibility(false);
      return;
    }

    var url = "https://api.foursquare.com/v3/places/search?ll=" +
      encodeURIComponent(lat + "," + lng) + "&radius=1000&limit=5";

    try {
      var response = await fetch(url, {
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        }
      });
      if (!response.ok) {
        setPlacesVisibility(false);
        return;
      }
      var data = await response.json();
      var results = data && data.results ? data.results : [];
      var mapped = results.map(function (item) {
        var distance = item.distance ? Math.round(item.distance) + " m" : "";
        return {
          name: item.name,
          distance: distance
        };
      });
      renderPlacesList(mapped);
    } catch (error) {
      setPlacesVisibility(false);
    }
  }

  async function fetchContactData(client) {
    try {
      var contacts = await client
        .from("site_contacts")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1);
      var socials = await client
        .from("site_social_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
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
        ? app.config.get("foursquareApiKey")
        : "";

      var contactSection = document.querySelector("[data-contact-section]");
      if (!contactSection) {
        return;
      }

      updateContactStatus(true);

      if (!app.supabase || typeof app.supabase.initClient !== "function") {
        updateContactStatus(false);
        renderContactMap(document.querySelector("[data-contact-map]"), defaultAddress, defaultLat, defaultLng);
        setPlacesVisibility(false);
        return;
      }

      var client = app.supabase.initClient();
      if (!client) {
        updateContactStatus(false);
        renderContactMap(document.querySelector("[data-contact-map]"), defaultAddress, defaultLat, defaultLng);
        setPlacesVisibility(false);
        return;
      }

      var response = await fetchContactData(client);
      updateContactStatus(false);

      if (response.error) {
        console.warn("Kontak belum tersedia.", response.error);
      }

      var contact = response.contact || {};
      var socials = response.socials || [];
      var address = contact.address || contact.alamat || defaultAddress;
      var contactPerson = String(contact.contact_person_name || "").trim();
      var phone = contact.phone || contact.telepon || contact.whatsapp || "-";
      var email = contact.email || "-";
      var description = contact.description || contact.keterangan || "Informasi kontak Dusun Jamus.";
      var lat = contact.latitude || contact.lat || defaultLat;
      var lng = contact.longitude || contact.lng || defaultLng;
      if (!address || isForbiddenAddress(address)) {
        address = defaultAddress;
      }
      if (!isValidCoordinate(lat, -90, 90)) {
        lat = defaultLat;
      }
      if (!isValidCoordinate(lng, -180, 180)) {
        lng = defaultLng;
      }
      if (!contactPerson) {
        contactPerson = "-";
      }

      updateContactText("[data-contact-description]", description);
      updateContactText("[data-contact-address]", "Alamat: " + address);
      updateContactText("[data-contact-person]", "Nama yang dihubungi / CP: " + contactPerson);
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

      renderContactMap(document.querySelector("[data-contact-map]"), address, lat, lng);
      setPlacesVisibility(false);
      if (apiKey) {
        searchNearbyPlaces(apiKey, lat, lng);
      }
    },
    renderPreview: function () {
      return;
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
