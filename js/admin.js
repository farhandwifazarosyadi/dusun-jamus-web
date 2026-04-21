/* admin.js - Simplified admin dashboard logic */
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
    return field.value.trim();
  }

  function setInputValue(form, name, value) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return;
    }
    field.value = value == null ? "" : value;
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

  var state = {
    umkmItems: []
  };

  async function initAdminPage() {
    if (!document.body.classList.contains("admin-page")) {
      return;
    }

    bindAdminEvents();
    await checkSession();
  }

  function renderLoginView() {
    setVisible($("[data-login-section]"), true);
    setVisible($("[data-access-denied]"), false);
    setVisible($("[data-admin-section]"), false);
    setText($("[data-admin-user]"), "Belum login");
    if ($("[data-admin-logout]")) {
      $("[data-admin-logout]").disabled = true;
    }
  }

  function renderDeniedView(message) {
    setVisible($("[data-login-section]"), false);
    setVisible($("[data-access-denied]"), true);
    setVisible($("[data-admin-section]"), false);
    setText($("[data-admin-user]"), "Akses ditolak");
    setText($("[data-denied-message]"), message || "Akun ini bukan admin aktif.");
    if ($("[data-admin-logout]")) {
      $("[data-admin-logout]").disabled = false;
    }
  }

  async function renderAdminView(session) {
    setVisible($("[data-login-section]"), false);
    setVisible($("[data-access-denied]"), false);
    setVisible($("[data-admin-section]"), true);
    setText($("[data-admin-user]"), session && session.user ? session.user.email : "Admin");
    if ($("[data-admin-logout]")) {
      $("[data-admin-logout]").disabled = false;
    }

    await loadLandingItems();
    await loadGalleryItems();
    await loadUmkmItems();
  }

  async function checkSession() {
    var authStatus = $("[data-auth-status]");
    if (!app.auth) {
      setStatus(authStatus, "Auth module belum tersedia.", true);
      return;
    }

    var sessionResponse = await app.auth.getCurrentSession();
    if (sessionResponse.error) {
      setStatus(authStatus, sessionResponse.error, true);
    }

    if (!sessionResponse.session) {
      renderLoginView();
      return;
    }

    var adminCheck = await app.auth.checkIsAdmin();
    if (adminCheck.error) {
      renderDeniedView("Gagal memeriksa admin: " + adminCheck.error);
      return;
    }

    if (!adminCheck.isAdmin) {
      renderDeniedView("Akun ini bukan admin aktif.");
      return;
    }

    await renderAdminView(sessionResponse.session);
  }

  function bindAdminEvents() {
    var loginForm = $("[data-login-form]");
    var logoutButton = $("[data-admin-logout]");
    var authStatus = $("[data-auth-status]");

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
        await checkSession();
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        await app.auth.logoutAdmin();
        renderLoginView();
      });
    }

    bindAdminTabs();
    bindLandingModule();
    bindGalleryModule();
    bindUmkmModule();
    bindUmkmDetailModule();
  }

  function bindAdminTabs() {
    var tabs = $all("[data-admin-tab]");
    var panels = $all("[data-admin-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-admin-tab");
        tabs.forEach(function (btn) {
          btn.classList.toggle("is-active", btn === tab);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-admin-panel") === target);
        });
      });
    });
  }

  async function loadLandingItems() {
    var list = $("[data-landing-list]");
    var status = $("[data-landing-status]");
    if (!app.supabase || !app.supabase.getLandingItems) {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat data landing...", false);
    var response = await app.supabase.getLandingItems();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.image_url || "-") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-landing-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-landing-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    setStatus(status, "", false);
  }

  function bindLandingModule() {
    var form = $("[data-landing-form]");
    var status = $("[data-landing-status]");
    var resetButton = $("[data-landing-reset]");
    var submitButton = $("[data-landing-submit]");
    var list = $("[data-landing-list]");

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
          image_url: getInputValue(form, "image_url")
        };
        var editId = form.dataset.editId;
        var response = editId
          ? await app.supabase.updateLandingItem(editId, payload)
          : await app.supabase.createLandingItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadLandingItems();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-landing-edit]");
        var deleteButton = event.target.closest("[data-landing-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-landing-edit" : "data-landing-delete");
        if (deleteButton) {
          if (!window.confirm("Hapus item landing ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteLandingItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadLandingItems();
          return;
        }

        var items = (await app.supabase.getLandingItems()).data || [];
        var item = items.find(function (row) { return String(row.id) === String(id); });
        if (!item) {
          setStatus(status, "Data tidak ditemukan.", true);
          return;
        }
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "image_url", item.image_url);
      });
    }
  }

  async function loadGalleryItems() {
    var list = $("[data-gallery-list]");
    var status = $("[data-gallery-status]");
    if (!app.supabase || !app.supabase.getGalleryItems) {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat galeri...", false);
    var response = await app.supabase.getGalleryItems();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    var items = response.data || [];
    if (list) {
      list.innerHTML = items.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.image_url || "-") + "</td>" +
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
        var payload = {
          title: getInputValue(form, "title"),
          image_url: getInputValue(form, "image_url")
        };
        var editId = form.dataset.editId;
        var response = editId
          ? await app.supabase.updateGalleryItem(editId, payload)
          : await app.supabase.createGalleryItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadGalleryItems();
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
        if (deleteButton) {
          if (!window.confirm("Hapus item galeri ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteGalleryItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadGalleryItems();
          return;
        }

        var items = (await app.supabase.getGalleryItems()).data || [];
        var item = items.find(function (row) { return String(row.id) === String(id); });
        if (!item) {
          setStatus(status, "Data tidak ditemukan.", true);
          return;
        }
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "image_url", item.image_url);
      });
    }
  }

  async function loadUmkmItems() {
    var list = $("[data-umkm-list]");
    var status = $("[data-umkm-status]");
    if (!app.supabase || !app.supabase.getUmkmItems) {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat UMKM...", false);
    var response = await app.supabase.getUmkmItems();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    state.umkmItems = response.data || [];
    if (list) {
      list.innerHTML = state.umkmItems.map(function (item) {
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + (item.image_url || "-") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-umkm-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-umkm-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    populateUmkmSelect();
    setStatus(status, "", false);
  }

  function bindUmkmModule() {
    var form = $("[data-umkm-form]");
    var status = $("[data-umkm-status]");
    var resetButton = $("[data-umkm-reset]");
    var submitButton = $("[data-umkm-submit]");
    var list = $("[data-umkm-list]");

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
          image_url: getInputValue(form, "image_url"),
          slug: slugify(getInputValue(form, "title"))
        };
        var editId = form.dataset.editId;
        var response = editId
          ? await app.supabase.updateUmkmItem(editId, payload)
          : await app.supabase.createUmkmItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        await loadUmkmItems();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-umkm-edit]");
        var deleteButton = event.target.closest("[data-umkm-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-umkm-edit" : "data-umkm-delete");
        if (deleteButton) {
          if (!window.confirm("Hapus item UMKM ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteUmkmItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await loadUmkmItems();
          return;
        }

        var item = state.umkmItems.find(function (row) { return String(row.id) === String(id); });
        if (!item) {
          setStatus(status, "Data tidak ditemukan.", true);
          return;
        }
        form.dataset.editId = item.id;
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "image_url", item.image_url);
      });
    }
  }

  function populateUmkmSelect() {
    var select = $("[data-umkm-select]");
    if (!select) {
      return;
    }
    var current = select.value;
    select.innerHTML = "<option value=\"\">Pilih UMKM</option>" +
      state.umkmItems.map(function (item) {
        return "<option value=\"" + item.id + "\">" + (item.title || "UMKM") + "</option>";
      }).join("");
    if (current) {
      select.value = current;
    }
  }

  async function bindUmkmDetailModule() {
    var form = $("[data-umkm-detail-form]");
    var select = $("[data-umkm-select]");
    var status = $("[data-umkm-detail-status]");

    if (select) {
      select.addEventListener("change", async function () {
        var id = select.value;
        if (!id) {
          form.reset();
          return;
        }
        var response = await app.supabase.getUmkmItemById(id);
        if (response.error || !response.data) {
          setStatus(status, response.error || "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        setInputValue(form, "title", item.title);
        setInputValue(form, "image_url", item.image_url);
        setInputValue(form, "full_description", item.full_description);
        setStatus(status, "", false);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!select || !select.value) {
          setStatus(status, "Pilih item UMKM terlebih dulu.", true);
          return;
        }
        var title = getInputValue(form, "title");
        var payload = {
          title: title,
          image_url: getInputValue(form, "image_url"),
          full_description: getInputValue(form, "full_description"),
          slug: slugify(title)
        };

        var response = await app.supabase.updateUmkmItem(select.value, payload);
        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        setStatus(status, "Detail tersimpan.", false);
        await loadUmkmItems();
      });
    }
  }

  app.admin = {
    initAdminPage: initAdminPage,
    renderLoginView: renderLoginView,
    renderAdminView: renderAdminView,
    bindAdminEvents: bindAdminEvents
  };

  document.addEventListener("DOMContentLoaded", function () {
    initAdminPage();
  });
})(window.DusunJamus = window.DusunJamus || {});
