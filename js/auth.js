/* auth.js - Supabase auth helpers for admin */
(function (app) {
  "use strict";

  function getClient() {
    if (!app.supabase || typeof app.supabase.initClient !== "function") {
      return null;
    }
    return app.supabase.initClient();
  }

  async function loginAdmin(email, password) {
    var client = getClient();
    if (!client) {
      return { data: null, error: "Supabase client belum siap." };
    }
    if (!email || !password) {
      return { data: null, error: "Email dan password wajib diisi." };
    }

    try {
      var response = await client.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (response.error) {
        return { data: null, error: response.error.message };
      }
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async function logoutAdmin() {
    var client = getClient();
    if (!client) {
      return { data: null, error: "Supabase client belum siap." };
    }

    try {
      var response = await client.auth.signOut();
      if (response.error) {
        return { data: null, error: response.error.message };
      }
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async function getCurrentSession() {
    var client = getClient();
    if (!client) {
      return { session: null, error: "Supabase client belum siap." };
    }

    try {
      var response = await client.auth.getSession();
      if (response.error) {
        return { session: null, error: response.error.message };
      }
      return { session: response.data ? response.data.session : null, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  }

  async function getCurrentUser() {
    var client = getClient();
    if (!client) {
      return { user: null, error: "Supabase client belum siap." };
    }

    try {
      var response = await client.auth.getUser();
      if (response.error) {
        return { user: null, error: response.error.message };
      }
      return { user: response.data ? response.data.user : null, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  async function checkIsAdmin() {
    var client = getClient();
    if (!client) {
      return { isAdmin: false, admin: null, error: "Supabase client belum siap." };
    }

    var userResponse = await getCurrentUser();
    if (userResponse.error) {
      return { isAdmin: false, admin: null, error: userResponse.error };
    }
    if (!userResponse.user) {
      return { isAdmin: false, admin: null, error: "User belum login." };
    }

    try {
      var response = await client
        .from("admin_users")
        .select("id, user_id, is_active")
        .eq("user_id", userResponse.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (response.error) {
        return { isAdmin: false, admin: null, error: response.error.message };
      }

      return {
        isAdmin: !!response.data,
        admin: response.data || null,
        error: null
      };
    } catch (error) {
      return { isAdmin: false, admin: null, error: error.message };
    }
  }

  app.auth = {
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin,
    getCurrentSession: getCurrentSession,
    getCurrentUser: getCurrentUser,
    checkIsAdmin: checkIsAdmin
  };
})(window.DusunJamus = window.DusunJamus || {});
