/* supabase.js - Supabase client setup and helpers */
(function (app) {
  "use strict";

  function emptyArrayFallback(message) {
    return { data: [], error: message || null, fallback: true };
  }

  function emptyItemFallback(message) {
    return { data: null, error: message || null, fallback: true };
  }

  function normalizeItems(items) {
    return Array.isArray(items) ? items : [];
  }

  function applyLimit(items, limit) {
    return normalizeItems(items).slice(0, Math.max(0, limit));
  }

  function filterByActive(items) {
    return normalizeItems(items).filter(function (item) {
      if (Object.prototype.hasOwnProperty.call(item, "is_active")) {
        return item.is_active === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "status")) {
        return item.status === "active";
      }
      return true;
    });
  }

  function filterByPublished(items) {
    return normalizeItems(items).filter(function (item) {
      if (Object.prototype.hasOwnProperty.call(item, "is_published")) {
        return item.is_published === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "status")) {
        return item.status === "published";
      }
      return true;
    });
  }

  function filterByFeatured(items) {
    return normalizeItems(items).filter(function (item) {
      if (Object.prototype.hasOwnProperty.call(item, "is_featured")) {
        return item.is_featured === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "featured")) {
        return item.featured === true;
      }
      return true;
    });
  }

  function getClient() {
    if (!app.supabase || typeof app.supabase.initClient !== "function") {
      return null;
    }
    return app.supabase.initClient();
  }

  async function selectAll(table) {
    var client = getClient();
    if (!client) {
      console.warn("Supabase belum siap untuk tabel:", table);
      return emptyArrayFallback("Supabase client belum siap.");
    }

    try {
      var response = await client.from(table).select("*");
      if (response.error) {
        console.warn("Supabase error pada tabel:", table, response.error.message);
        return emptyArrayFallback(response.error.message);
      }
      return { data: normalizeItems(response.data), error: null };
    } catch (error) {
      console.warn("Supabase request gagal pada tabel:", table, error);
      return emptyArrayFallback(error.message);
    }
  }

  async function selectBySlug(table, slug) {
    var client = getClient();
    if (!client) {
      console.warn("Supabase belum siap untuk tabel:", table);
      return emptyItemFallback("Supabase client belum siap.");
    }

    if (!slug) {
      console.warn("Slug tidak valid untuk tabel:", table);
      return emptyItemFallback("Slug tidak valid.");
    }

    try {
      var response = await client.from(table).select("*").eq("slug", slug).limit(1);
      if (response.error) {
        console.warn("Supabase error pada tabel:", table, response.error.message);
        return emptyItemFallback(response.error.message);
      }
      var item = Array.isArray(response.data) ? response.data[0] : null;
      return { data: item || null, error: null };
    } catch (error) {
      console.warn("Supabase request gagal pada tabel:", table, error);
      return emptyItemFallback(error.message);
    }
  }

  app.supabase = {
    client: null,
    initClient: function () {
      if (app.supabase.client) {
        return app.supabase.client;
      }

      if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.warn("Supabase client library belum dimuat.");
        return null;
      }

      if (!app.config || !app.config.supabaseUrl || !app.config.supabaseAnonKey) {
        console.warn("Supabase URL atau Anon Key belum diisi.");
        return null;
      }

      app.supabase.client = window.supabase.createClient(
        app.config.supabaseUrl,
        app.config.supabaseAnonKey
      );

      return app.supabase.client;
    },
    getSiteProfile: async function () {
      var response = await selectAll("site_profiles");
      return { data: response.data[0] || null, error: response.error };
    },
    getSiteContacts: async function () {
      return selectAll("site_contacts");
    },
    getSiteSocialLinks: async function () {
      return selectAll("site_social_links");
    },
    getHeroSlides: async function () {
      return selectAll("hero_slides");
    },
    getPublishedNews: async function (limit) {
      var response = await selectAll("news_posts");
      var items = filterByPublished(response.data);
      return { data: applyLimit(items, limit || 3), error: response.error };
    },
    getAllPublishedNews: async function () {
      var response = await selectAll("news_posts");
      var items = filterByPublished(response.data);
      return { data: items, error: response.error };
    },
    getActiveGalleryItems: async function (limit) {
      var response = await selectAll("gallery_items");
      var items = filterByActive(response.data);
      return { data: applyLimit(items, limit || 6), error: response.error };
    },
    getAllActiveGalleryItems: async function () {
      var response = await selectAll("gallery_items");
      var items = filterByActive(response.data);
      return { data: items, error: response.error };
    },
    getFeaturedPotentials: async function (limit) {
      var response = await selectAll("potential_items");
      var items = filterByFeatured(response.data);
      return { data: applyLimit(items, limit || 4), error: response.error };
    },
    getAllActivePotentials: async function () {
      var response = await selectAll("potential_items");
      var items = filterByActive(response.data);
      return { data: items, error: response.error };
    },
    getPotentialBySlug: async function (slug) {
      return selectBySlug("potential_items", slug);
    },
    getActiveFacilityLocations: async function () {
      var response = await selectAll("facility_locations");
      var items = filterByActive(response.data);
      return { data: items, error: response.error };
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
