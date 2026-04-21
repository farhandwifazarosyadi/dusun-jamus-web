/* admin.js - Admin dashboard logic */
(function (app) {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setVisible(element, visible) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", !visible);
  }

  function setText(element, text) {
    if (element) {
      element.textContent = text || "";
    }
  }

  function getClient() {
    if (!app.supabase || typeof app.supabase.initClient !== "function") {
      return null;
    }
    return app.supabase.initClient();
  }

  function setStatus(target, message, isError) {
    if (!target) {
      return;
    }
    target.textContent = message || "";
    target.classList.toggle("is-error", !!isError);
  }

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function getInputValue(form, name) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return "";
    }
    if (field.type === "checkbox") {
      return field.checked;
    }
    return field.value.trim();
  }

  function setInputValue(form, name, value) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return;
    }
    if (field.type === "checkbox") {
      field.checked = !!value;
      return;
    }
    if (field.type === "datetime-local") {
      field.value = formatDatetimeLocal(value);
      return;
    }
    field.value = value == null ? "" : value;
  }

  function formatDatetimeLocal(value) {
    if (!value) {
      return "";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 16);
  }

  function parseNumber(value) {
    if (value === "") {
      return null;
    }
    var parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function resetForm(form, submitButton) {
    if (!form) {
      return;
    }
    form.reset();
    form.dataset.editId = "";
    if (submitButton) {
      submitButton.textContent = "Simpan";
    }
  }

  async function initAdminPage() {
    if (!document.body.classList.contains("admin-page")) {
      return;
    }

    var authArea = $("[data-auth-area]");
    var deniedArea = $("[data-admin-denied]");
    var dashboardArea = $("[data-admin-dashboard]");
    var userLabel = $("[data-admin-user]");
    var logoutButton = $("[data-admin-logout]");
    var loginForm = $("[data-login-form]");
    var authStatus = $("[data-auth-status]");

    if (!app.auth) {
      setStatus(authStatus, "Auth module belum tersedia.", true);
      return;
    }

    function showAuth() {
      setVisible(authArea, true);
      setVisible(deniedArea, false);
      setVisible(dashboardArea, false);
      setText(userLabel, "Belum login");
    }

    function showDenied(message) {
      setVisible(authArea, false);
      setVisible(deniedArea, true);
      setVisible(dashboardArea, false);
      if (message) {
        deniedArea.querySelector("p").textContent = message;
      }
    }

    async function showDashboard(session) {
      setVisible(authArea, false);
      setVisible(deniedArea, false);
      setVisible(dashboardArea, true);
      setText(userLabel, session && session.user ? session.user.email : "Admin");
      await loadAllSections();
    }

    async function verifyAdmin(session) {
      if (!session) {
        showAuth();
        return;
      }
      var adminCheck = await app.auth.checkIsAdmin();
      if (adminCheck.error) {
        showDenied("Gagal memeriksa admin: " + adminCheck.error);
        return;
      }
      if (!adminCheck.isAdmin) {
        showDenied("Akun ini belum terdaftar sebagai admin aktif.");
        return;
      }
      await showDashboard(session);
    }

    var sessionResponse = await app.auth.getCurrentSession();
    if (sessionResponse.error) {
      setStatus(authStatus, sessionResponse.error, true);
    }
    await verifyAdmin(sessionResponse.session);

    if (loginForm) {
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        setStatus(authStatus, "", false);
        var email = getInputValue(loginForm, "email");
        var password = getInputValue(loginForm, "password");
        var response = await app.auth.loginAdmin(email, password);
        if (response.error) {
          setStatus(authStatus, response.error, true);
          return;
        }
        var newSession = await app.auth.getCurrentSession();
        await verifyAdmin(newSession.session);
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        await app.auth.logoutAdmin();
        showAuth();
      });
    }

    bindAdminNav();
    bindHeroModule();
    bindProfileModule();
    bindNewsModule();
    bindGalleryModule();
    bindPotentialsModule();
    bindContactModule();
    bindSocialModule();
  }

  function bindAdminNav() {
    var navButtons = $all("[data-admin-nav]");
    var panels = $all("[data-admin-panel]");
    if (!navButtons.length) {
      return;
    }
    navButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-admin-nav");
        navButtons.forEach(function (btn) {
          btn.classList.toggle("is-active", btn === button);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-admin-panel") === target);
        });
      });
    });
  }

  async function loadAllSections() {
    await Promise.all([
      loadHeroSlides(),
      loadProfile(),
      loadNews(),
      loadGallery(),
      loadPotentials(),
      loadContacts(),
      loadSocials()
    ]);
  }

  async function loadHeroSlides() {
    var list = $("[data-hero-list]");
    var status = $("[data-hero-status]");
    var client = getClient();
    if (!client) {
      setStatus(status, "Supabase client belum siap.", true);
      return;
    }

    setStatus(status, "Memuat hero...", false);
    var response = await client.from("hero_slides").select("*").order("sort_order", { ascending: true });
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.subtitle || "-") + "</td>" +
          "<td>" + (item.sort_order == null ? "-" : item.sort_order) + "</td>" +
          "<td>" + (item.is_active ? "Ya" : "Tidak") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-hero-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-hero-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    setStatus(status, "", false);
  }

  function bindHeroModule() {
    var form = $("[data-hero-form]");
    var status = $("[data-hero-status]");
    var resetButton = $("[data-hero-reset]");
    var submitButton = $("[data-hero-submit]");
    var list = $("[data-hero-list]");

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var payload = {
          title: getInputValue(form, "title"),
          subtitle: getInputValue(form, "subtitle"),
          image_url: getInputValue(form, "image_url"),
          cta_label: getInputValue(form, "cta_label"),
          cta_target: getInputValue(form, "cta_target"),
          sort_order: parseNumber(getInputValue(form, "sort_order")),
          is_active: getInputValue(form, "is_active")
        };

        var editId = form.dataset.editId;
        var response;
        if (editId) {
          response = await app.supabase.updateHeroSlide(editId, payload);
        } else {
          response = await app.supabase.createHeroSlide(payload);
        }

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadHeroSlides();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-hero-edit]");
        var deleteButton = event.target.closest("[data-hero-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-hero-edit" : "data-hero-delete");
        var client = getClient();
        if (!client) {
          setStatus(status, "Supabase client belum siap.", true);
          return;
        }

        if (deleteButton) {
          if (!window.confirm("Hapus hero slide ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteHeroSlide(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadHeroSlides();
          return;
        }

        var response = await client.from("hero_slides").select("*").eq("id", id).maybeSingle();
        if (response.error || !response.data) {
          setStatus(status, response.error ? response.error.message : "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "subtitle", item.subtitle);
        setInputValue(form, "image_url", item.image_url);
        setInputValue(form, "cta_label", item.cta_label);
        setInputValue(form, "cta_target", item.cta_target);
        setInputValue(form, "sort_order", item.sort_order);
        setInputValue(form, "is_active", item.is_active);
      });
    }
  }

  async function loadProfile() {
    var form = $("[data-profile-form]");
    var status = $("[data-profile-status]");
    var client = getClient();
    if (!client || !form) {
      return;
    }

    setStatus(status, "Memuat profil...", false);
    var response = await client
      .from("site_profiles")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(1);

    var item = response.data && response.data[0] ? response.data[0] : null;
    if (!item) {
      var fallback = await client.from("site_profiles").select("*").order("id", { ascending: false }).limit(1);
      item = fallback.data && fallback.data[0] ? fallback.data[0] : null;
    }

    if (item) {
      form.dataset.editId = item.id;
      setInputValue(form, "title", item.title);
      setInputValue(form, "subtitle", item.subtitle);
      setInputValue(form, "short_description", item.short_description);
      setInputValue(form, "full_description", item.full_description);
      setInputValue(form, "vision", item.vision);
      setInputValue(form, "mission", item.mission);
      setInputValue(form, "history", item.history);
      setInputValue(form, "featured_image_url", item.featured_image_url);
      setInputValue(form, "is_active", item.is_active);
    }

    setStatus(status, "", false);
  }

  function bindProfileModule() {
    var form = $("[data-profile-form]");
    var status = $("[data-profile-status]");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var payload = {
        title: getInputValue(form, "title"),
        subtitle: getInputValue(form, "subtitle"),
        short_description: getInputValue(form, "short_description"),
        full_description: getInputValue(form, "full_description"),
        vision: getInputValue(form, "vision"),
        mission: getInputValue(form, "mission"),
        history: getInputValue(form, "history"),
        featured_image_url: getInputValue(form, "featured_image_url"),
        is_active: getInputValue(form, "is_active")
      };

      var editId = form.dataset.editId;
      if (!editId) {
        setStatus(status, "Data profil belum ada di database.", true);
        return;
      }

      var response = await app.supabase.updateSiteProfile(editId, payload);
      if (response.error) {
        setStatus(status, response.error, true);
        return;
      }
      setStatus(status, "Profil tersimpan.", false);
      await loadProfile();
    });
  }

  async function loadNews() {
    var list = $("[data-news-list]");
    var status = $("[data-news-status]");
    var client = getClient();
    if (!client) {
      setStatus(status, "Supabase client belum siap.", true);
      return;
    }

    setStatus(status, "Memuat berita...", false);
    var response = await client.from("news_posts").select("*").order("published_at", { ascending: false });
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.slug || "-") + "</td>" +
          "<td>" + (item.is_published ? "Ya" : "Tidak") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-news-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-news-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }
    setStatus(status, "", false);
  }

  function bindNewsModule() {
    var form = $("[data-news-form]");
    var status = $("[data-news-status]");
    var resetButton = $("[data-news-reset]");
    var submitButton = $("[data-news-submit]");
    var list = $("[data-news-list]");

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = getInputValue(form, "title");
        var slug = getInputValue(form, "slug") || slugify(title);
        var payload = {
          title: title,
          slug: slug,
          excerpt: getInputValue(form, "excerpt"),
          content: getInputValue(form, "content"),
          featured_image_url: getInputValue(form, "featured_image_url"),
          author_name: getInputValue(form, "author_name"),
          published_at: getInputValue(form, "published_at") || null,
          is_published: getInputValue(form, "is_published")
        };

        var editId = form.dataset.editId;
        var response;
        if (editId) {
          response = await app.supabase.updateNewsPost(editId, payload);
        } else {
          response = await app.supabase.createNewsPost(payload);
        }

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadNews();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-news-edit]");
        var deleteButton = event.target.closest("[data-news-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-news-edit" : "data-news-delete");
        var client = getClient();
        if (!client) {
          setStatus(status, "Supabase client belum siap.", true);
          return;
        }

        if (deleteButton) {
          if (!window.confirm("Hapus berita ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteNewsPost(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadNews();
          return;
        }

        var response = await client.from("news_posts").select("*").eq("id", id).maybeSingle();
        if (response.error || !response.data) {
          setStatus(status, response.error ? response.error.message : "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "slug", item.slug);
        setInputValue(form, "excerpt", item.excerpt);
        setInputValue(form, "content", item.content);
        setInputValue(form, "featured_image_url", item.featured_image_url);
        setInputValue(form, "author_name", item.author_name);
        setInputValue(form, "published_at", item.published_at);
        setInputValue(form, "is_published", item.is_published);
      });
    }
  }

  async function loadGallery() {
    var list = $("[data-gallery-list]");
    var status = $("[data-gallery-status]");
    var client = getClient();
    if (!client) {
      setStatus(status, "Supabase client belum siap.", true);
      return;
    }

    setStatus(status, "Memuat galeri...", false);
    var response = await client.from("gallery_items").select("*").order("sort_order", { ascending: true });
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.category || "-") + "</td>" +
          "<td>" + (item.is_active ? "Ya" : "Tidak") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-gallery-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-gallery-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }
    setStatus(status, "", false);
  }

  function bindGalleryModule() {
    var form = $("[data-gallery-form]");
    var status = $("[data-gallery-status]");
    var resetButton = $("[data-gallery-reset]");
    var submitButton = $("[data-gallery-submit]");
    var list = $("[data-gallery-list]");

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = getInputValue(form, "title");
        var slug = getInputValue(form, "slug") || slugify(title);
        var payload = {
          title: title,
          slug: slug,
          description: getInputValue(form, "description"),
          image_url: getInputValue(form, "image_url"),
          category: getInputValue(form, "category"),
          taken_at: getInputValue(form, "taken_at") || null,
          is_featured: getInputValue(form, "is_featured"),
          sort_order: parseNumber(getInputValue(form, "sort_order")),
          is_active: getInputValue(form, "is_active")
        };

        var editId = form.dataset.editId;
        var response;
        if (editId) {
          response = await app.supabase.updateGalleryItem(editId, payload);
        } else {
          response = await app.supabase.createGalleryItem(payload);
        }

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadGallery();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-gallery-edit]");
        var deleteButton = event.target.closest("[data-gallery-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-gallery-edit" : "data-gallery-delete");
        var client = getClient();
        if (!client) {
          setStatus(status, "Supabase client belum siap.", true);
          return;
        }

        if (deleteButton) {
          if (!window.confirm("Hapus item galeri ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteGalleryItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadGallery();
          return;
        }

        var response = await client.from("gallery_items").select("*").eq("id", id).maybeSingle();
        if (response.error || !response.data) {
          setStatus(status, response.error ? response.error.message : "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "slug", item.slug);
        setInputValue(form, "description", item.description);
        setInputValue(form, "image_url", item.image_url);
        setInputValue(form, "category", item.category);
        setInputValue(form, "taken_at", item.taken_at);
        setInputValue(form, "is_featured", item.is_featured);
        setInputValue(form, "sort_order", item.sort_order);
        setInputValue(form, "is_active", item.is_active);
      });
    }
  }

  async function loadPotentials() {
    var list = $("[data-potentials-list]");
    var status = $("[data-potentials-status]");
    var client = getClient();
    if (!client) {
      setStatus(status, "Supabase client belum siap.", true);
      return;
    }

    setStatus(status, "Memuat potensi...", false);
    var response = await client.from("potential_items").select("*").order("sort_order", { ascending: true });
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.category || "-") + "</td>" +
          "<td>" + (item.is_active ? "Ya" : "Tidak") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-potentials-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-potentials-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }
    setStatus(status, "", false);
  }

  function bindPotentialsModule() {
    var form = $("[data-potentials-form]");
    var status = $("[data-potentials-status]");
    var resetButton = $("[data-potentials-reset]");
    var submitButton = $("[data-potentials-submit]");
    var list = $("[data-potentials-list]");

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = getInputValue(form, "title");
        var slug = getInputValue(form, "slug") || slugify(title);
        var payload = {
          title: title,
          slug: slug,
          type: getInputValue(form, "type"),
          short_description: getInputValue(form, "short_description"),
          full_description: getInputValue(form, "full_description"),
          image_url: getInputValue(form, "image_url"),
          category: getInputValue(form, "category"),
          price_text: getInputValue(form, "price_text"),
          contact_text: getInputValue(form, "contact_text"),
          location_text: getInputValue(form, "location_text"),
          is_featured: getInputValue(form, "is_featured"),
          sort_order: parseNumber(getInputValue(form, "sort_order")),
          is_active: getInputValue(form, "is_active")
        };

        var editId = form.dataset.editId;
        var response;
        if (editId) {
          response = await app.supabase.updatePotentialItem(editId, payload);
        } else {
          response = await app.supabase.createPotentialItem(payload);
        }

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadPotentials();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-potentials-edit]");
        var deleteButton = event.target.closest("[data-potentials-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-potentials-edit" : "data-potentials-delete");
        var client = getClient();
        if (!client) {
          setStatus(status, "Supabase client belum siap.", true);
          return;
        }

        if (deleteButton) {
          if (!window.confirm("Hapus potensi ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deletePotentialItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadPotentials();
          return;
        }

        var response = await client.from("potential_items").select("*").eq("id", id).maybeSingle();
        if (response.error || !response.data) {
          setStatus(status, response.error ? response.error.message : "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "slug", item.slug);
        setInputValue(form, "type", item.type);
        setInputValue(form, "short_description", item.short_description);
        setInputValue(form, "full_description", item.full_description);
        setInputValue(form, "image_url", item.image_url);
        setInputValue(form, "category", item.category);
        setInputValue(form, "price_text", item.price_text);
        setInputValue(form, "contact_text", item.contact_text);
        setInputValue(form, "location_text", item.location_text);
        setInputValue(form, "is_featured", item.is_featured);
        setInputValue(form, "sort_order", item.sort_order);
        setInputValue(form, "is_active", item.is_active);
      });
    }
  }

  async function loadContacts() {
    var form = $("[data-contact-form]");
    var status = $("[data-contact-status]");
    var client = getClient();
    if (!client || !form) {
      return;
    }

    setStatus(status, "Memuat kontak...", false);
    var response = await client.from("site_contacts").select("*").limit(1);
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var item = response.data && response.data[0] ? response.data[0] : null;
    if (item) {
      form.dataset.editId = item.id;
      setInputValue(form, "address", item.address || item.alamat);
      setInputValue(form, "phone", item.phone || item.telepon || item.whatsapp);
      setInputValue(form, "email", item.email);
      setInputValue(form, "description", item.description || item.keterangan);
      setInputValue(form, "latitude", item.latitude || item.lat);
      setInputValue(form, "longitude", item.longitude || item.lng);
    }

    setStatus(status, "", false);
  }

  function bindContactModule() {
    var form = $("[data-contact-form]");
    var status = $("[data-contact-status]");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var payload = {
        address: getInputValue(form, "address"),
        phone: getInputValue(form, "phone"),
        email: getInputValue(form, "email"),
        description: getInputValue(form, "description"),
        latitude: getInputValue(form, "latitude"),
        longitude: getInputValue(form, "longitude")
      };

      var editId = form.dataset.editId;
      if (!editId) {
        setStatus(status, "Data kontak belum ada di database.", true);
        return;
      }

      var response = await app.supabase.updateSiteContact(editId, payload);
      if (response.error) {
        setStatus(status, response.error, true);
        return;
      }
      setStatus(status, "Kontak tersimpan.", false);
      await loadContacts();
    });
  }

  async function loadSocials() {
    var list = $("[data-social-list]");
    var status = $("[data-social-status]");
    var client = getClient();
    if (!client) {
      setStatus(status, "Supabase client belum siap.", true);
      return;
    }

    setStatus(status, "Memuat social links...", false);
    var response = await client.from("site_social_links").select("*");
    if (response.error) {
      setStatus(status, response.error.message, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.label || item.platform || "-") + "</td>" +
          "<td>" + (item.url || item.link || "-") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-social-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-social-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }
    setStatus(status, "", false);
  }

  function bindSocialModule() {
    var form = $("[data-social-form]");
    var status = $("[data-social-status]");
    var resetButton = $("[data-social-reset]");
    var submitButton = $("[data-social-submit]");
    var list = $("[data-social-list]");

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var payload = {
          label: getInputValue(form, "label"),
          url: getInputValue(form, "url")
        };

        var editId = form.dataset.editId;
        var response;
        if (editId) {
          response = await app.supabase.updateSocialLink(editId, payload);
        } else {
          response = await app.supabase.createSocialLink(payload);
        }

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadSocials();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-social-edit]");
        var deleteButton = event.target.closest("[data-social-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-social-edit" : "data-social-delete");
        var client = getClient();
        if (!client) {
          setStatus(status, "Supabase client belum siap.", true);
          return;
        }

        if (deleteButton) {
          if (!window.confirm("Hapus social link ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteSocialLink(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadSocials();
          return;
        }

        var response = await client.from("site_social_links").select("*").eq("id", id).maybeSingle();
        if (response.error || !response.data) {
          setStatus(status, response.error ? response.error.message : "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "label", item.label || item.platform);
        setInputValue(form, "url", item.url || item.link);
      });
    }
  }

  function bindAdminEvents() {
    initAdminPage();
  }

  app.admin = {
    initAdminPage: initAdminPage,
    renderAdminLayout: bindAdminNav,
    bindAdminEvents: bindAdminEvents
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindAdminEvents();
  });
})(window.DusunJamus = window.DusunJamus || {});
