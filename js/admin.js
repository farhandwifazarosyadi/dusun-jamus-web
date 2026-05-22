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

  function resolveSchemaCacheMessage(errorMessage) {
    if (!errorMessage) {
      return "";
    }
    var message = String(errorMessage).toLowerCase();
    if (message.indexOf("schema cache") !== -1) {
      return "Data Karang Taruna belum dapat dimuat. Pastikan tabel sudah dibuat dan schema Supabase sudah reload.";
    }
    return String(errorMessage);
  }

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function sanitizeNumberString(value) {
    return String(value || "").replace(/[^0-9]/g, "");
  }

  function formatRupiah(value) {
    var clean = sanitizeNumberString(value);
    var number = Number(clean);
    if (!number) {
      return "-";
    }
    var formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
    return formatted.replace("Rp", "Rp. ");
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

  function getInputValue(form, name) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return "";
    }
    return field.value.trim();
  }

  function getCheckboxValue(form, name) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    return field ? field.checked : false;
  }

  function setInputValue(form, name, value) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return;
    }
    field.value = value == null ? "" : value;
  }

  function setCheckboxValue(form, name, value) {
    var field = form.querySelector("[name=\"" + name + "\"]");
    if (!field) {
      return;
    }
    field.checked = value === true;
  }

  function resetForm(form, submitButton) {
    if (!form) {
      return;
    }
    form.reset();
    form.dataset.editId = "";
    form.dataset.currentImage = "";
    clearFormPreviews(form);
    if (submitButton) {
      submitButton.textContent = "Simpan";
    }
  }

  function getFileInput(form, selector) {
    return form ? form.querySelector(selector) : null;
  }

  function getFileFromInput(input) {
    return input && input.files && input.files[0] ? input.files[0] : null;
  }

  function setPreviewImage(preview, url) {
    if (!preview) {
      return;
    }
    if (preview.dataset.objectUrl) {
      URL.revokeObjectURL(preview.dataset.objectUrl);
      preview.dataset.objectUrl = "";
    }
    if (url) {
      preview.src = url;
      preview.classList.add("is-visible");
    } else {
      preview.removeAttribute("src");
      preview.classList.remove("is-visible");
    }
  }

  function bindPreview(input, preview) {
    if (!input || !preview) {
      return;
    }
    input.addEventListener("change", function () {
      var file = getFileFromInput(input);
      if (!file) {
        setPreviewImage(preview, "");
        return;
      }
      var objectUrl = URL.createObjectURL(file);
      preview.dataset.objectUrl = objectUrl;
      setPreviewImage(preview, objectUrl);
    });
  }

  function clearFormPreviews(form) {
    if (!form) {
      return;
    }
    $all(".admin-preview", form).forEach(function (preview) {
      setPreviewImage(preview, "");
    });
  }

  var state = {
    umkmItems: [],
    karangMembers: [],
    umkmCatalogItems: [],
    socialLinks: []
  };
  var adminTabLoaded = {};

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

    adminTabLoaded = {};
    var activeTab = document.querySelector("[data-admin-tab].is-active") || document.querySelector("[data-admin-tab]");
    if (activeTab) {
      await loadAdminTab(activeTab.getAttribute("data-admin-tab"));
    }
  }

  async function loadAdminTab(tab) {
    if (!tab || adminTabLoaded[tab]) {
      return;
    }

    if (tab === "landing") {
      await loadLandingItems();
    } else if (tab === "about") {
      await loadAboutProfile();
    } else if (tab === "contact") {
      await loadContactInfo();
      await loadSocialLinks();
    } else if (tab === "gallery") {
      await loadGalleryItems();
    } else if (tab === "umkm") {
      await loadUmkmItems();
    } else if (tab === "umkm-detail") {
      await loadUmkmItems();
    } else if (tab === "umkm-catalog") {
      await loadUmkmItems();
      await renderUmkmCatalogItems();
    } else if (tab === "karang-taruna") {
      await renderKarangTarunaAdmin();
    }

    adminTabLoaded[tab] = true;
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
    bindAboutModule();
    bindContactModule();
    bindGalleryModule();
    bindUmkmModule();
    bindUmkmDetailModule();
    bindKarangTarunaForm();
    bindUmkmCatalogForm();
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
        loadAdminTab(target);
      });
    });
  }

  async function loadAboutProfile() {
    var form = $("[data-about-form]");
    var status = $("[data-about-status]");
    if (!form) {
      return;
    }
    if (!app.supabase || typeof app.supabase.getSiteProfile !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat data tentang dusun...", false);
    var response = await app.supabase.getSiteProfile();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    var profile = response.data || {};
    form.dataset.profileId = profile.id || "";
    setInputValue(form, "history", profile.history || "");
    setInputValue(form, "full_description", profile.full_description || "");
    setStatus(status, "", false);
  }

  function bindAboutModule() {
    var form = $("[data-about-form]");
    var status = $("[data-about-status]");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!app.supabase || typeof app.supabase.updateSiteProfile !== "function") {
        setStatus(status, "Supabase helper belum tersedia.", true);
        return;
      }

      var payload = {
        history: getInputValue(form, "history"),
        full_description: getInputValue(form, "full_description")
      };

      setStatus(status, "Menyimpan...", false);
      var response = await app.supabase.updateSiteProfile(payload);
      if (response.error) {
        setStatus(status, response.error, true);
        return;
      }
      setStatus(status, "Tersimpan.", false);
    });
  }

  async function loadContactInfo() {
    var form = $("[data-contact-form]");
    var status = $("[data-contact-status]");
    if (!form) {
      return;
    }
    if (!app.supabase || typeof app.supabase.getActiveSiteContact !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat data kontak...", false);
    var response = await app.supabase.getActiveSiteContact();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    var contact = response.data || {};
    form.dataset.contactId = contact.id || "";
    setInputValue(form, "address", contact.address || "");
    setInputValue(form, "contact_person_name", contact.contact_person_name || "");
    setInputValue(form, "phone", contact.phone || "");
    setInputValue(form, "whatsapp", contact.whatsapp || "");
    setInputValue(form, "email", contact.email || "");
    setStatus(status, "", false);
  }

  async function loadSocialLinks() {
    var list = $("[data-contact-social-list]");
    var status = $("[data-contact-social-status]");
    if (!app.supabase || typeof app.supabase.getSiteSocialLinks !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat media sosial...", false);
    var response = await app.supabase.getSiteSocialLinks();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    state.socialLinks = response.data || [];
    if (list) {
      list.innerHTML = state.socialLinks.map(function (item) {
        var activeLabel = item.is_active ? "Ya" : "Tidak";
        return "<tr>" +
          "<td>" + (item.platform || "-") + "</td>" +
          "<td>" + (item.label || "-") + "</td>" +
          "<td>" + (item.url || "-") + "</td>" +
          "<td>" + activeLabel + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-contact-social-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-contact-social-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    setStatus(status, "", false);
  }

  function bindContactModule() {
    var contactForm = $("[data-contact-form]");
    var contactStatus = $("[data-contact-status]");
    var socialForm = $("[data-contact-social-form]");
    var socialStatus = $("[data-contact-social-status]");
    var socialReset = $("[data-contact-social-reset]");
    var socialList = $("[data-contact-social-list]");

    if (contactForm) {
      contactForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!app.supabase || typeof app.supabase.saveSiteContact !== "function") {
          setStatus(contactStatus, "Supabase helper belum tersedia.", true);
          return;
        }

        var payload = {
          address: getInputValue(contactForm, "address"),
          contact_person_name: getInputValue(contactForm, "contact_person_name"),
          phone: getInputValue(contactForm, "phone"),
          whatsapp: getInputValue(contactForm, "whatsapp"),
          email: getInputValue(contactForm, "email")
        };

        setStatus(contactStatus, "Menyimpan kontak...", false);
        var response = await app.supabase.saveSiteContact(payload);
        if (response.error) {
          setStatus(contactStatus, response.error, true);
          return;
        }
        setStatus(contactStatus, "Kontak tersimpan.", false);
        await loadContactInfo();
      });
    }

    if (socialReset && socialForm) {
      socialReset.addEventListener("click", function () {
        resetForm(socialForm);
        setCheckboxValue(socialForm, "is_active", true);
      });
    }

    if (socialForm) {
      socialForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!app.supabase || typeof app.supabase.createSiteSocialLink !== "function") {
          setStatus(socialStatus, "Supabase helper belum tersedia.", true);
          return;
        }

        var editId = socialForm.dataset.editId;
        var payload = {
          platform: getInputValue(socialForm, "platform"),
          label: getInputValue(socialForm, "label"),
          url: getInputValue(socialForm, "url"),
          icon_name: getInputValue(socialForm, "icon_name"),
          sort_order: parseInt(getInputValue(socialForm, "sort_order"), 10),
          is_active: getCheckboxValue(socialForm, "is_active")
        };

        setStatus(socialStatus, "Menyimpan media sosial...", false);
        var response = editId
          ? await app.supabase.updateSiteSocialLink(editId, payload)
          : await app.supabase.createSiteSocialLink(payload);
        if (response.error) {
          setStatus(socialStatus, response.error, true);
          return;
        }

        resetForm(socialForm);
        setCheckboxValue(socialForm, "is_active", true);
        setStatus(socialStatus, "Media sosial tersimpan.", false);
        await loadSocialLinks();
      });
    }

    if (socialList) {
      socialList.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-contact-social-edit]");
        var deleteButton = event.target.closest("[data-contact-social-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(editButton ? "data-contact-social-edit" : "data-contact-social-delete");
        if (deleteButton) {
          if (!window.confirm("Hapus media sosial ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteSiteSocialLink(id);
          if (deleteResponse.error) {
            setStatus(socialStatus, deleteResponse.error, true);
            return;
          }
          await loadSocialLinks();
          return;
        }

        var item = state.socialLinks.find(function (row) { return String(row.id) === String(id); });
        if (!item) {
          setStatus(socialStatus, "Data tidak ditemukan.", true);
          return;
        }
        socialForm.dataset.editId = item.id;
        setInputValue(socialForm, "platform", item.platform);
        setInputValue(socialForm, "label", item.label);
        setInputValue(socialForm, "url", item.url);
        setInputValue(socialForm, "icon_name", item.icon_name);
        setInputValue(socialForm, "sort_order", item.sort_order);
        setCheckboxValue(socialForm, "is_active", item.is_active === true);
        setStatus(socialStatus, "", false);
      });
    }
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
        var imageHtml = item.image_url
          ? "<img class=\"admin-thumb\" src=\"" + item.image_url + "\" alt=\"Preview\" />"
          : "-";
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + imageHtml + "</td>" +
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
    var fileInput = getFileInput(form, "[data-landing-file]");
    var preview = $("[data-landing-preview]");

    bindPreview(fileInput, preview);

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var editId = form.dataset.editId;
        if (!editId) {
          setStatus(status, "Pilih item landing yang akan diperbarui.", true);
          return;
        }

        var file = getFileFromInput(fileInput);
        if (!file) {
          setStatus(status, "Pilih gambar landing terlebih dulu.", true);
          return;
        }

        if (!app.supabase || !app.supabase.uploadSiteImage) {
          setStatus(status, "Helper upload belum tersedia.", true);
          return;
        }

        setStatus(status, "Mengunggah gambar...", false);
        var uploadResponse = await app.supabase.uploadSiteImage(file);
        if (uploadResponse.error) {
          setStatus(status, uploadResponse.error, true);
          return;
        }

        var imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        if (!imageUrl) {
          setStatus(status, "Gagal mendapatkan URL gambar.", true);
          return;
        }

        var response = await app.supabase.updateLandingImage(editId, imageUrl);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        setPreviewImage(preview, "");
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
        setPreviewImage(preview, item.image_url || "");
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
        var imageHtml = item.image_url
          ? "<img class=\"admin-thumb\" src=\"" + item.image_url + "\" alt=\"Preview\" />"
          : "-";
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + imageHtml + "</td>" +
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
    var fileInput = getFileInput(form, "[data-gallery-file]");
    var preview = $("[data-gallery-preview]");

    bindPreview(fileInput, preview);

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = getInputValue(form, "title");
        var editId = form.dataset.editId;
        var file = getFileFromInput(fileInput);
        var imageUrl = form.dataset.currentImage || "";

        if (!editId && !file) {
          setStatus(status, "Pilih gambar galeri terlebih dulu.", true);
          return;
        }

        if (file) {
          setStatus(status, "Mengunggah gambar...", false);
          var uploadResponse = await app.supabase.uploadGalleryImage(file);
          if (uploadResponse.error) {
            setStatus(status, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        if (!imageUrl) {
          setStatus(status, "Gambar galeri belum tersedia.", true);
          return;
        }

        var payload = {
          title: title,
          image_url: imageUrl,
          description: getInputValue(form, "description"),
          slug: slugify(title)
        };

        var response = editId
          ? await app.supabase.updateGalleryItem(editId, payload)
          : await app.supabase.createGalleryItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        setPreviewImage(preview, "");
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
        form.dataset.currentImage = item.image_url || "";
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setInputValue(form, "description", item.description);
        setPreviewImage(preview, item.image_url || "");
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
        var imageHtml = item.image_url
          ? "<img class=\"admin-thumb\" src=\"" + item.image_url + "\" alt=\"Preview\" />"
          : "-";
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + imageHtml + "</td>" +
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
    var fileInput = getFileInput(form, "[data-umkm-file]");
    var preview = $("[data-umkm-preview]");

    bindPreview(fileInput, preview);

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = getInputValue(form, "title");
        var editId = form.dataset.editId;
        var file = getFileFromInput(fileInput);
        var imageUrl = form.dataset.currentImage || "";

        if (!editId && !file) {
          setStatus(status, "Pilih gambar UMKM terlebih dulu.", true);
          return;
        }

        if (file) {
          setStatus(status, "Mengunggah gambar...", false);
          var uploadResponse = await app.supabase.uploadPotentialImage(file);
          if (uploadResponse.error) {
            setStatus(status, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        if (!imageUrl) {
          setStatus(status, "Gambar UMKM belum tersedia.", true);
          return;
        }

        var payload = {
          title: title,
          image_url: imageUrl,
          slug: slugify(title)
        };

        var response = editId
          ? await app.supabase.updateUmkmItem(editId, payload)
          : await app.supabase.createUmkmItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }
        resetForm(form, submitButton);
        setPreviewImage(preview, "");
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
        form.dataset.currentImage = item.image_url || "";
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        setInputValue(form, "title", item.title);
        setPreviewImage(preview, item.image_url || "");
      });
    }
  }

  function populateUmkmSelect() {
    var selects = $all("[data-umkm-select], [data-umkm-catalog-select]");
    if (!selects.length) {
      return;
    }
    selects.forEach(function (select) {
      var current = select.value;
      select.innerHTML = "<option value=\"\">Pilih UMKM</option>" +
        state.umkmItems.map(function (item) {
          return "<option value=\"" + item.id + "\">" + (item.title || "UMKM") + "</option>";
        }).join("");
      if (current) {
        select.value = current;
      }
    });
  }

  async function bindUmkmDetailModule() {
    var form = $("[data-umkm-detail-form]");
    var select = $("[data-umkm-select]");
    var status = $("[data-umkm-detail-status]");

    var fileInput = getFileInput(form, "[data-umkm-detail-file]");
    var preview = $("[data-umkm-detail-preview]");

    bindPreview(fileInput, preview);
    if (select) {
      select.addEventListener("change", async function () {
        var id = select.value;
        if (!id) {
          form.reset();
          form.dataset.currentImage = "";
          setPreviewImage(preview, "");
          return;
        }
        var response = await app.supabase.getUmkmItemById(id);
        if (response.error || !response.data) {
          setStatus(status, response.error || "Data tidak ditemukan.", true);
          return;
        }
        var item = response.data;
        setInputValue(form, "title", item.title);
        setInputValue(form, "maps_url", item.maps_url);
        form.dataset.currentImage = item.image_url || "";
        setPreviewImage(preview, item.image_url || "");
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
        var file = getFileFromInput(fileInput);
        var imageUrl = form.dataset.currentImage || "";

        if (file) {
          setStatus(status, "Mengunggah gambar...", false);
          var uploadResponse = await app.supabase.uploadPotentialImage(file);
          if (uploadResponse.error) {
            setStatus(status, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        if (!imageUrl) {
          setStatus(status, "Gambar UMKM belum tersedia.", true);
          return;
        }

        var payload = {
          title: title,
          image_url: imageUrl,
          full_description: getInputValue(form, "full_description"),
          maps_url: getInputValue(form, "maps_url"),
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

  async function renderKarangTarunaAdmin() {
    await loadKarangTarunaInfo();
    await renderKarangTarunaMembers();
  }

  async function loadKarangTarunaInfo() {
    var form = $("[data-karang-info-form]");
    var status = $("[data-karang-info-status]");
    var preview = $("[data-karang-structure-preview]");
    if (!form) {
      return;
    }
    if (!app.supabase || typeof app.supabase.getKarangTarunaInformation !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat informasi Karang Taruna...", false);
    var response = await app.supabase.getKarangTarunaInformation();
    if (response.error) {
      setStatus(status, resolveSchemaCacheMessage(response.error), true);
      return;
    }

    var info = response.data || {};
    form.dataset.infoId = info.id || "";
    form.dataset.currentImage = info.structure_image_url || "";
    setInputValue(form, "title", info.title || "");
    setInputValue(form, "description", info.description || "");
    setPreviewImage(preview, info.structure_image_url || "");
    if (!info.id) {
      setStatus(status, "Data Karang Taruna belum tersedia.", false);
      return;
    }
    setStatus(status, "", false);
  }

  function bindKarangTarunaForm() {
    var infoForm = $("[data-karang-info-form]");
    var infoStatus = $("[data-karang-info-status]");
    var infoReset = $("[data-karang-info-reset]");
    var structureInput = getFileInput(infoForm, "[data-karang-structure-file]");
    var structurePreview = $("[data-karang-structure-preview]");

    bindPreview(structureInput, structurePreview);

    if (infoReset) {
      infoReset.addEventListener("click", function () {
        loadKarangTarunaInfo();
      });
    }

    if (infoForm) {
      infoForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!app.supabase || typeof app.supabase.saveKarangTarunaInformation !== "function") {
          setStatus(infoStatus, "Supabase helper belum tersedia.", true);
          return;
        }

        var title = getInputValue(infoForm, "title");
        var description = getInputValue(infoForm, "description");
        var file = getFileFromInput(structureInput);
        var imageUrl = infoForm.dataset.currentImage || "";

        if (file) {
          setStatus(infoStatus, "Mengunggah struktur organisasi...", false);
          var uploadResponse = await app.supabase.uploadKarangTarunaImage(file);
          if (uploadResponse.error) {
            setStatus(infoStatus, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        var payload = {
          title: title,
          description: description,
          structure_image_url: imageUrl
        };

        setStatus(infoStatus, "Menyimpan informasi...", false);
        var response = await app.supabase.saveKarangTarunaInformation(payload);
        if (response.error) {
          setStatus(infoStatus, response.error, true);
          return;
        }

        infoForm.dataset.currentImage = imageUrl || "";
        setPreviewImage(structurePreview, imageUrl || "");
        setStatus(infoStatus, "Tersimpan.", false);
      });
    }

    var memberForm = $("[data-karang-member-form]");
    var memberStatus = $("[data-karang-member-status]");
    var memberReset = $("[data-karang-member-reset]");
    var memberSubmit = $("[data-karang-member-submit]");
    var memberList = $("[data-karang-member-list]");
    var memberFile = getFileInput(memberForm, "[data-karang-member-file]");
    var memberPreview = $("[data-karang-member-preview]");

    bindPreview(memberFile, memberPreview);

    if (memberReset && memberForm) {
      memberReset.addEventListener("click", function () {
        resetForm(memberForm, memberSubmit);
        setStatus(memberStatus, "", false);
      });
    }

    if (memberForm) {
      memberForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!app.supabase || typeof app.supabase.createKarangTarunaMember !== "function") {
          setStatus(memberStatus, "Supabase helper belum tersedia.", true);
          return;
        }

        var editId = memberForm.dataset.editId;
        var name = getInputValue(memberForm, "name");
        var position = getInputValue(memberForm, "position");
        var description = getInputValue(memberForm, "description");
        var file = getFileFromInput(memberFile);
        var imageUrl = memberForm.dataset.currentImage || "";

        if (!editId && !file) {
          setStatus(memberStatus, "Pilih foto anggota terlebih dulu.", true);
          return;
        }

        if (file) {
          setStatus(memberStatus, "Mengunggah foto anggota...", false);
          var uploadResponse = await app.supabase.uploadKarangTarunaImage(file);
          if (uploadResponse.error) {
            setStatus(memberStatus, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        var payload = {
          name: name,
          position: position,
          description: description,
          photo_url: imageUrl,
          sort_order: 0,
          is_active: true
        };

        var response = editId
          ? await app.supabase.updateKarangTarunaMember(editId, payload)
          : await app.supabase.createKarangTarunaMember(payload);

        if (response.error) {
          setStatus(memberStatus, response.error, true);
          return;
        }

        resetForm(memberForm, memberSubmit);
        setPreviewImage(memberPreview, "");
        setStatus(memberStatus, "Tersimpan.", false);
        await renderKarangTarunaMembers();
      });
    }

    if (memberList) {
      memberList.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-karang-member-edit]");
        var deleteButton = event.target.closest("[data-karang-member-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(
          editButton ? "data-karang-member-edit" : "data-karang-member-delete"
        );

        if (deleteButton) {
          if (!window.confirm("Hapus anggota ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteKarangTarunaMember(id);
          if (deleteResponse.error) {
            setStatus(memberStatus, deleteResponse.error, true);
            return;
          }
          await renderKarangTarunaMembers();
          return;
        }

        var item = state.karangMembers.find(function (row) {
          return String(row.id) === String(id);
        });
        if (!item) {
          setStatus(memberStatus, "Data tidak ditemukan.", true);
          return;
        }

        memberForm.dataset.editId = item.id;
        memberForm.dataset.currentImage = item.photo_url || "";
        if (memberSubmit) {
          memberSubmit.textContent = "Update";
        }
        setInputValue(memberForm, "name", item.name || "");
        setInputValue(memberForm, "position", item.position || "");
        setInputValue(memberForm, "description", item.description || "");
        setPreviewImage(memberPreview, item.photo_url || "");
      });
    }
  }

  async function renderKarangTarunaMembers() {
    var list = $("[data-karang-member-list]");
    var status = $("[data-karang-member-status]");
    if (!app.supabase || typeof app.supabase.getKarangTarunaMembers !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat anggota Karang Taruna...", false);
    var response = await app.supabase.getKarangTarunaMembers();
    if (response.error) {
      setStatus(status, resolveSchemaCacheMessage(response.error), true);
      return;
    }

    state.karangMembers = sortKarangTarunaMembers(response.data || []);
    if (list) {
      list.innerHTML = state.karangMembers.map(function (item) {
        var imageHtml = item.photo_url
          ? "<img class=\"admin-thumb\" src=\"" + item.photo_url + "\" alt=\"Preview\" />"
          : "-";
        return "<tr>" +
          "<td>" + imageHtml + "</td>" +
          "<td>" + (item.name || "-") + "</td>" +
          "<td>" + (item.position || "-") + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-karang-member-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-karang-member-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    if (!state.karangMembers.length) {
      setStatus(status, "Data anggota Karang Taruna belum tersedia.", false);
      return;
    }
    setStatus(status, "", false);
  }

  async function renderUmkmCatalogAdmin() {
    await renderUmkmCatalogItems();
  }

  function bindUmkmCatalogForm() {
    var form = $("[data-umkm-catalog-form]");
    var status = $("[data-umkm-catalog-status]");
    var resetButton = $("[data-umkm-catalog-reset]");
    var submitButton = $("[data-umkm-catalog-submit]");
    var list = $("[data-umkm-catalog-list]");
    var select = $("[data-umkm-catalog-select]");
    var fileInput = getFileInput(form, "[data-umkm-catalog-file]");
    var preview = $("[data-umkm-catalog-preview]");

    bindPreview(fileInput, preview);

    if (resetButton && form) {
      resetButton.addEventListener("click", function () {
        resetForm(form, submitButton);
        setStatus(status, "", false);
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!app.supabase || typeof app.supabase.createUmkmCatalogItem !== "function") {
          setStatus(status, "Supabase helper belum tersedia.", true);
          return;
        }

        if (!select || !select.value) {
          setStatus(status, "Pilih UMKM terlebih dulu.", true);
          return;
        }

        var editId = form.dataset.editId;
        var title = getInputValue(form, "title");
        var description = getInputValue(form, "description");
        var priceText = sanitizeNumberString(getInputValue(form, "price_text"));
        var file = getFileFromInput(fileInput);
        var imageUrl = form.dataset.currentImage || "";

        if (!editId && !file) {
          setStatus(status, "Pilih gambar produk terlebih dulu.", true);
          return;
        }

        if (file) {
          setStatus(status, "Mengunggah gambar produk...", false);
          var uploadResponse = await app.supabase.uploadUmkmCatalogImage(file);
          if (uploadResponse.error) {
            setStatus(status, uploadResponse.error, true);
            return;
          }
          imageUrl = uploadResponse.data ? uploadResponse.data.publicUrl : "";
        }

        var payload = {
          umkm_id: select.value,
          title: title,
          description: description,
          price_text: priceText,
          image_url: imageUrl,
          sort_order: 0,
          is_active: true
        };

        var response = editId
          ? await app.supabase.updateUmkmCatalogItem(editId, payload)
          : await app.supabase.createUmkmCatalogItem(payload);

        if (response.error) {
          setStatus(status, response.error, true);
          return;
        }

        resetForm(form, submitButton);
        setPreviewImage(preview, "");
        setStatus(status, "Tersimpan.", false);
        await renderUmkmCatalogItems();
      });
    }

    if (list) {
      list.addEventListener("click", async function (event) {
        var editButton = event.target.closest("[data-umkm-catalog-edit]");
        var deleteButton = event.target.closest("[data-umkm-catalog-delete]");
        if (!editButton && !deleteButton) {
          return;
        }

        var id = (editButton || deleteButton).getAttribute(
          editButton ? "data-umkm-catalog-edit" : "data-umkm-catalog-delete"
        );

        if (deleteButton) {
          if (!window.confirm("Hapus item katalog ini?")) {
            return;
          }
          var deleteResponse = await app.supabase.deleteUmkmCatalogItem(id);
          if (deleteResponse.error) {
            setStatus(status, deleteResponse.error, true);
            return;
          }
          await renderUmkmCatalogItems();
          return;
        }

        var item = state.umkmCatalogItems.find(function (row) {
          return String(row.id) === String(id);
        });
        if (!item) {
          setStatus(status, "Data tidak ditemukan.", true);
          return;
        }

        form.dataset.editId = item.id;
        form.dataset.currentImage = item.image_url || "";
        if (submitButton) {
          submitButton.textContent = "Update";
        }
        if (select) {
          select.value = item.umkm_id || "";
        }
        setInputValue(form, "title", item.title || "");
        setInputValue(form, "description", item.description || "");
        setInputValue(form, "price_text", sanitizeNumberString(item.price_text || ""));
        setPreviewImage(preview, item.image_url || "");
      });
    }
  }

  async function renderUmkmCatalogItems() {
    var list = $("[data-umkm-catalog-list]");
    var status = $("[data-umkm-catalog-status]");
    if (!app.supabase || typeof app.supabase.getUmkmCatalogItems !== "function") {
      setStatus(status, "Supabase helper belum tersedia.", true);
      return;
    }

    setStatus(status, "Memuat katalog UMKM...", false);
    var response = await app.supabase.getUmkmCatalogItems();
    if (response.error) {
      setStatus(status, response.error, true);
      return;
    }

    state.umkmCatalogItems = response.data || [];
    var umkmMap = state.umkmItems.reduce(function (acc, item) {
      acc[String(item.id)] = item.title || "UMKM";
      return acc;
    }, {});

    if (list) {
      list.innerHTML = state.umkmCatalogItems.map(function (item) {
        var imageHtml = item.image_url
          ? "<img class=\"admin-thumb\" src=\"" + item.image_url + "\" alt=\"Preview\" />"
          : "-";
        var umkmTitle = umkmMap[String(item.umkm_id)] || "-";
        var priceLabel = item.price_text ? formatRupiah(item.price_text) : "-";
        return "<tr>" +
          "<td>" + (item.title || "-") + "</td>" +
          "<td>" + priceLabel + "</td>" +
          "<td>" + umkmTitle + "</td>" +
          "<td>" + imageHtml + "</td>" +
          "<td>" +
            "<button class=\"admin-link\" data-umkm-catalog-edit=\"" + item.id + "\">Edit</button>" +
            "<button class=\"admin-link danger\" data-umkm-catalog-delete=\"" + item.id + "\">Hapus</button>" +
          "</td>" +
        "</tr>";
      }).join("");
    }

    setStatus(status, "", false);
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
