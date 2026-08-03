// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const tokenCookie = useCookie("auth_token");

  // ✅ علامة التهيئة يجب أن تُضبط دائماً في النهاية
  // حتى لو فشل جلب البيانات، لكي لا يبقى الـ Middleware منتظراً للأبد
  try {
    if (tokenCookie.value && !authStore.initialized) {
      authStore.token = tokenCookie.value;
      await authStore.fetchUserProfile();
    }
  } catch (error) {
    console.warn("[Auth] Init failed:", error);
    // إذا فشل الجلب، امسح التوكن الفاسد بصمت حتى لا يعيد الـ Middleware التوجيه
    authStore.clearAuthSilent();
  } finally {
    // 🔑 المفتاح: ضع initialized = true دائماً في النهاية
    authStore.initialized = true;
  }

  // مراقبة الكوكيز كل 5 دقائق (Multi-tab sync)
  if (process.client) {
    setInterval(() => {
      const currentToken = tokenCookie.value;
      if (currentToken && !authStore.token) {
        authStore.token = currentToken;
        authStore.fetchUserProfile().catch(() => {});
      }
      if (!currentToken && authStore.token) {
        authStore.token = null;
        authStore.user = null;
        authStore.initialized = true;
      }
    }, 300000);
  }
});
