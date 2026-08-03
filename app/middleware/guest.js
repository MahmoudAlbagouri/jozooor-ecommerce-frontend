// middleware/guest.ts
import { nextTick } from "vue";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const tokenCookie = useCookie("auth_token");

  // ✅ انتظر حتى تكتمل تهيئة المصادقة قبل اتخاذ أي قرار
  // هذا يمنع الـ Race Condition مع الـ Plugin
  if (!authStore.initialized && process.client) {
    await nextTick();
    // أعطِ الـ Plugin فرصة للتهيئة (بحد أقصى 500ms)
    let attempts = 0;
    while (!authStore.initialized && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      attempts++;
    }
  }

  // ✅ التحقق المزدوج: الكوكيز + حالة الـ Store
  const hasValidSession = !!tokenCookie.value && authStore.initialized;

  // الحالة 1: مسجل دخول + يحاول فتح صفحة عامة (login/register)
  if (hasValidSession && (to.path === "/login" || to.path === "/register")) {
    return navigateTo("/");
  }

  // الحالة 2: غير مسجل دخول + يحاول فتح صفحة محمية
  if (!hasValidSession && to.meta?.requiresAuth) {
    return navigateTo("/login");
  }
});
