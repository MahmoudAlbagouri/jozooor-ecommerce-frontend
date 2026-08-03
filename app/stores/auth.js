// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    refreshToken: null,
    initialized: false,
    isRefreshing: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    // ✅ تسجيل الدخول
    async login(credentials) {
      const config = useRuntimeConfig();
      try {
        const payload = {
          identifier: credentials.email,
          password: credentials.password,
        };

        const response = await $fetch(`${config.public.apiBase}/auth/login`, {
          method: "POST",
          body: payload,
        });

        if (response.success) {
          this.saveAuthData(response.data);
          return { success: true };
        }
        return {
          success: false,
          error: response.message || "خطأ في تسجيل الدخول",
        };
      } catch (error) {
        console.error("Login Error:", error);
        return {
          success: false,
          error: error.data?.message || "حدث خطأ غير متوقع",
        };
      }
    },

    // ✅ تسجيل حساب جديد
    async register(userData) {
      const config = useRuntimeConfig();
      try {
        const response = await $fetch(
          `${config.public.apiBase}/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              password: userData.password,
              confirmPassword: userData.confirmPassword,
            },
          },
        );

        if (response.success) {
          this.saveAuthData(response.data);
          return { success: true };
        }
        return {
          success: false,
          error: response.message || "فشل إنشاء الحساب",
        };
      } catch (error) {
        console.error("Register Error:", error);
        return {
          success: false,
          error: error.data?.message || "حدث خطأ أثناء التسجيل",
        };
      }
    },

    // ✅ حفظ بيانات المصادقة
    saveAuthData(data) {
      const isProd = !process.dev;

      const tokenCookie = useCookie("auth_token", {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      });

      const refreshCookie = useCookie("refresh_token", {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      });

      tokenCookie.value = data.access_token;
      refreshCookie.value = data.refresh_token;

      this.token = data.access_token;
      this.refreshToken = data.refresh_token;
      this.user = data.user;
      this.initialized = true;
    },

    // ✅ تحديث التوكن
    async refreshAccessToken() {
      if (this.isRefreshing) {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!this.isRefreshing && this.token) {
              clearInterval(checkInterval);
              resolve(true);
            } else if (!this.isRefreshing && !this.token) {
              clearInterval(checkInterval);
              resolve(false);
            }
          }, 100);
        });
      }

      const refreshCookie = useCookie("refresh_token");
      const currentRefreshToken = refreshCookie.value;

      if (!currentRefreshToken) {
        this.clearAuth();
        return false;
      }

      this.isRefreshing = true;
      const config = useRuntimeConfig();

      try {
        const response = await $fetch(
          `${config.public.apiBase}/auth/refresh-token`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentRefreshToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response?.success && response?.data?.access_token) {
          const newAccessToken = response.data.access_token;
          const newRefreshToken =
            response.data.refresh_token || currentRefreshToken;
          const newUser = response.data.user;

          const isProd = !process.dev;

          const tokenCookie = useCookie("auth_token", {
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
            path: "/",
            secure: isProd,
          });

          const newRefreshCookie = useCookie("refresh_token", {
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
            path: "/",
            secure: isProd,
          });

          tokenCookie.value = newAccessToken;
          newRefreshCookie.value = newRefreshToken;

          this.token = newAccessToken;
          this.refreshToken = newRefreshToken;
          if (newUser) this.user = newUser;

          this.isRefreshing = false;
          return true;
        } else {
          throw new Error("فشل تحديث التوكن: بنية البيانات الراجعة غير صالحة");
        }
      } catch (error) {
        console.error("🚨 Refresh Token Failed:", error);
        this.isRefreshing = false;
        this.clearAuth();

        if (process.client) {
          navigateTo("/login");
        }
        return false;
      }
    },

    // ✅ تهيئة حالة المستخدم
    async fetchUserProfile() {
      const tokenCookie = useCookie("auth_token");
      const refreshCookie = useCookie("refresh_token");

      if (tokenCookie.value) {
        this.token = tokenCookie.value;
        if (refreshCookie.value) {
          this.refreshToken = refreshCookie.value;
        }
      } else {
        // 🔑 استخدم التنظيف الصامت بدلاً من clearAuth العادي
        // لتجنب إعادة التوجيه المفاجئة أثناء التهيئة
        this.clearAuthSilent();
        return;
      }

      // هنا يمكنك إضافة طلب جلب البروفايل من الـ API إذا أردت
      // const config = useRuntimeConfig();
      // const response = await $fetch(`${config.public.apiBase}/user/profile`, {
      //   headers: { Authorization: `Bearer ${this.token}` }
      // });
      // if (response.success) this.user = response.data;

      this.initialized = true;
    },

    // ✅ تسجيل الخروج
    logout() {
      this.clearAuth();
      navigateTo("/");
    },

    // ✅ مسح بيانات المصادقة (مع إعادة توجيه)
    clearAuth() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.initialized = false;
      this.isRefreshing = false;

      useCookie("auth_token").value = null;
      useCookie("refresh_token").value = null;

      if (process.client) {
        navigateTo("/");
      }
    },

    // ✅ مسح بيانات المصادقة بصمت (بدون إعادة توجيه)
    // يُستخدم فقط عند فشل التهيئة الأولية لتجنب Loop بين /login و /
    clearAuthSilent() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isRefreshing = false;
      // ❌ لا تغير initialized هنا — الـ Plugin سيتولى ضبطها في finally
      // ❌ لا تقم بـ navigateTo أو window.location هنا

      useCookie("auth_token").value = null;
      useCookie("refresh_token").value = null;
    },

    // ✅ تهيئة المصادقة عند تحميل التطبيق
    async initializeAuth() {
      const tokenCookie = useCookie("auth_token");
      const refreshCookie = useCookie("refresh_token");

      if (tokenCookie.value) {
        this.token = tokenCookie.value;
        if (refreshCookie.value) {
          this.refreshToken = refreshCookie.value;
        }
        await this.fetchUserProfile();
      }
      this.initialized = true;
    },
  },
});
