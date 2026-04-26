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

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function buildStorageFilename(prefix, fileName) {
    var ext = "";
    if (fileName) {
      var dotIndex = fileName.lastIndexOf(".");
      if (dotIndex !== -1) {
        ext = fileName.slice(dotIndex).toLowerCase();
      }
    }
    var random = Math.random().toString(36).slice(2, 10);
    return prefix + "-" + Date.now() + "-" + random + ext;
  }

  async function uploadToBucket(bucket, folder, file) {
    var client = getClient();
    if (!client) {
      return { data: null, error: "Supabase client belum siap." };
    }
    if (!file) {
      return { data: null, error: "File belum dipilih." };
    }

    var path = folder + "/" + buildStorageFilename(folder, file.name || "image");
    try {
      var uploadResponse = await client.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type || "image/*" });

      if (uploadResponse.error) {
        return { data: null, error: uploadResponse.error.message };
      }

      var publicResponse = client.storage.from(bucket).getPublicUrl(path);
      return {
        data: {
          path: path,
          publicUrl: publicResponse && publicResponse.data ? publicResponse.data.publicUrl : ""
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
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

  async function writeData(table, action) {
    var client = getClient();
    if (!client) {
      console.warn("Supabase belum siap untuk tabel:", table);
      return { data: null, error: "Supabase client belum siap." };
    }

    try {
      var response = await action(client);
      if (response.error) {
        console.warn("Supabase write error pada tabel:", table, response.error.message);
        return { data: null, error: response.error.message };
      }
      return { data: response.data || null, error: null };
    } catch (error) {
      console.warn("Supabase write gagal pada tabel:", table, error);
      return { data: null, error: error.message };
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
    },
    getLandingItems: async function () {
      var client = getClient();
      if (!client) {
        return emptyArrayFallback("Supabase client belum siap.");
      }
      try {
        var response = await client
          .from("hero_slides")
          .select("id, title, image_url")
          .order("sort_order", { ascending: true });
        if (response.error) {
          return emptyArrayFallback(response.error.message);
        }
        return { data: normalizeItems(response.data), error: null };
      } catch (error) {
        return emptyArrayFallback(error.message);
      }
    },
    getGalleryItems: async function () {
      var client = getClient();
      if (!client) {
        return emptyArrayFallback("Supabase client belum siap.");
      }
      try {
        var response = await client
          .from("gallery_items")
          .select("id, title, image_url")
          .order("id", { ascending: false });
        if (response.error) {
          return emptyArrayFallback(response.error.message);
        }
        return { data: normalizeItems(response.data), error: null };
      } catch (error) {
        return emptyArrayFallback(error.message);
      }
    },
    getUmkmItems: async function () {
      var client = getClient();
      if (!client) {
        return emptyArrayFallback("Supabase client belum siap.");
      }
      try {
        var response = await client
          .from("potential_items")
          .select("id, title, image_url, full_description, slug, type")
          .eq("type", "umkm")
          .order("id", { ascending: false });
        if (response.error) {
          return emptyArrayFallback(response.error.message);
        }
        return { data: normalizeItems(response.data), error: null };
      } catch (error) {
        return emptyArrayFallback(error.message);
      }
    },
    getUmkmItemById: async function (id) {
      var client = getClient();
      if (!client) {
        return emptyItemFallback("Supabase client belum siap.");
      }
      if (!id) {
        return emptyItemFallback("ID tidak valid.");
      }
      try {
        var response = await client
          .from("potential_items")
          .select("id, title, image_url, full_description, slug, type")
          .eq("id", id)
          .eq("type", "umkm")
          .maybeSingle();
        if (response.error) {
          return emptyItemFallback(response.error.message);
        }
        return { data: response.data || null, error: null };
      } catch (error) {
        return emptyItemFallback(error.message);
      }
    },
    uploadSiteImage: function (file) {
      return uploadToBucket("site-images", "landing", file);
    },
    uploadGalleryImage: function (file) {
      return uploadToBucket("gallery-images", "gallery", file);
    },
    uploadPotentialImage: function (file) {
      return uploadToBucket("potential-images", "umkm", file);
    },
    createLandingItem: function (data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        is_active: true,
        sort_order: 0
      };
      return writeData("hero_slides", function (client) {
        return client.from("hero_slides").insert([payload]).select("*");
      });
    },
    updateLandingItem: function (id, data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        is_active: true,
        sort_order: 0
      };
      return writeData("hero_slides", function (client) {
        return client.from("hero_slides").update(payload).eq("id", id).select("*");
      });
    },
    updateLandingImage: function (id, imageUrl) {
      var payload = {
        image_url: imageUrl || "",
        is_active: true
      };
      return writeData("hero_slides", function (client) {
        return client.from("hero_slides").update(payload).eq("id", id).select("*");
      });
    },
    deleteLandingItem: function (id) {
      return writeData("hero_slides", function (client) {
        return client.from("hero_slides").delete().eq("id", id).select("*");
      });
    },
    createGalleryItem: function (data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        slug: data.slug || slugify(data.title || ""),
        is_active: true,
        sort_order: 0
      };
      return writeData("gallery_items", function (client) {
        return client.from("gallery_items").insert([payload]).select("*");
      });
    },
    updateGalleryItem: function (id, data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        slug: data.slug || slugify(data.title || ""),
        is_active: true
      };
      return writeData("gallery_items", function (client) {
        return client.from("gallery_items").update(payload).eq("id", id).select("*");
      });
    },
    deleteGalleryItem: function (id) {
      return writeData("gallery_items", function (client) {
        return client.from("gallery_items").delete().eq("id", id).select("*");
      });
    },
    createUmkmItem: function (data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        type: "umkm",
        slug: data.slug || slugify(data.title || ""),
        is_active: true
      };
      return writeData("potential_items", function (client) {
        return client.from("potential_items").insert([payload]).select("*");
      });
    },
    updateUmkmItem: function (id, data) {
      var payload = {
        title: data.title || "",
        image_url: data.image_url || "",
        full_description: data.full_description || null,
        type: "umkm",
        slug: data.slug || slugify(data.title || "")
      };
      return writeData("potential_items", function (client) {
        return client.from("potential_items").update(payload).eq("id", id).select("*");
      });
    },
    deleteUmkmItem: function (id) {
      return writeData("potential_items", function (client) {
        return client.from("potential_items").delete().eq("id", id).select("*");
      });
    }
  };
})(window.DusunJamus = window.DusunJamus || {});
