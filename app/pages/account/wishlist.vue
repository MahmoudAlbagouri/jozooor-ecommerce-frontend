<template>
  <div class="account-layout">
    <aside class="sidebar">
      <AccountSidebar />
    </aside>

    <main class="main-content">
      <div class="account-card">
        <h1 class="card-title">
          <Icon name="ph:heart" class="title-icon" />
          المفضلة
        </h1>

        <!-- تحميل -->
        <div
          v-if="wishlistStore.loading && !wishlistStore.items.length"
          class="loading-state"
        >
          <div class="spinner"></div>
          <p>جاري تحميل قائمة أمنياتك...</p>
        </div>

        <!-- فارغة -->
        <div v-else-if="wishlistStore.items.length === 0" class="empty-state">
          <div class="empty-visual">
            <Icon name="ph:heart-break" class="empty-icon" />
            <div class="empty-ring"></div>
          </div>
          <h3 class="empty-title">قائمة المفضلة فارغة</h3>
          <p class="empty-sub">
            احفظ المنتجات التي تعجبك هنا وارجع إليها متى شئت
          </p>
          <NuxtLink to="/shop" class="go-btn">
            <Icon name="ph:storefront" />
            تصفح المنتجات
          </NuxtLink>
        </div>

        <!-- المنتجات -->
        <div v-else class="wishlist-wrapper">
          <!-- عداد -->
          <div class="list-header">
            <span class="list-count">
              <Icon name="ph:heart-fill" class="count-icon" />
              {{ wishlistStore.items.length }} منتج في المفضلة
            </span>
            <NuxtLink to="/shop" class="add-more-link">
              <Icon name="ph:plus" />
              إضافة المزيد
            </NuxtLink>
          </div>

          <div class="wishlist-grid">
            <ProductCard
              v-for="item in wishlistStore.items"
              :key="item.id"
              :product="item.product"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useWishlistStore } from "@/stores/wishlist";
import ProductCard from "@/components/global/ProductCard.vue";
import AccountSidebar from "@/components/base/AccountSidebar.vue";

definePageMeta({
  middleware: ["guest"],
  requiresAuth: true,
});

useSeoMeta({
  title: "قائمة المفضلة | متجر جذور",
  description: "راجع المنتجات في قائمة أمنياتك وأضفها إلى سلتك بسهولة.",
});

const wishlistStore = useWishlistStore();
const { currentLang } = useLanguage();

onMounted(() => wishlistStore.fetchWishlist());
watch(currentLang, async () => {
  await wishlistStore.fetchWishlist();
});
</script>

<style scoped lang="scss">
.account-layout {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  // background: linear-gradient(135deg, #f0faf4 0%, #e8f5ed 60%, #f5faf7 100%);
  padding: 32px 20px 40px;
  gap: 24px;
  direction: rtl;
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px 12px 32px;
  }
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  @media (max-width: 768px) {
    width: 100%;
  }
}
.main-content {
  flex: 1;
  min-width: 0;
}

.account-card {
  position: relative;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 16px 50px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  padding: 72px 36px 40px;
  min-height: 400px;
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  @media (max-width: 600px) {
    padding: 68px 16px 28px;
    border-radius: 18px;
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-title {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  font-size: 19px;
  font-weight: 800;
  color: white;
  white-space: nowrap;
  background: linear-gradient(
    135deg,
    var(--color-green-primary),
    var(--color-green-hover)
  );
  border-radius: 50px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  .title-icon {
    font-size: 20px;
  }
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.15);
  border-top-color: var(--color-green-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Empty ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.empty-visual {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 60px;
  color: #f87171;
  opacity: 0.35;
  position: relative;
  z-index: 1;
  animation: heartbeat 2.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.12);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.06);
  }
}

.empty-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(248, 113, 113, 0.2);
  animation: ringRotate 10s linear infinite;
}
@keyframes ringRotate {
  to {
    transform: rotate(360deg);
  }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
  max-width: 280px;
  line-height: 1.6;
}

.go-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  background: linear-gradient(
    135deg,
    var(--color-green-primary),
    var(--color-green-hover)
  );
  color: white;
  border-radius: 14px;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: all 0.25s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    filter: brightness(1.05);
  }
}

/* ── هيدر القائمة ── */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  direction: rtl;
}

.list-count {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  .count-icon {
    font-size: 16px;
    color: #f87171;
  }
}

.add-more-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-green-primary);
  text-decoration: none;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.2);
  transition: all 0.25s;
  &:hover {
    background: rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.07);
  }
}

/* ── Grid ── */
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
