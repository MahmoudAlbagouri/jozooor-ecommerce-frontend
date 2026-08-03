<template>
  <TheMobileNavOverlay
    v-if="isMobileValue"
    :mobile-menu-open="mobileMenuOpen"
    @close="closeMobileMenu"
  />

  <div
    v-if="searchPopupOpen"
    class="search-overlay"
    @click="closeSearchPopup"
  ></div>

  <TheSearchPopup
    v-if="searchPopupOpen"
    :search-query="searchQuery"
    :search-input-ref="searchInputRef"
    @update:search-query="onSearchQueryUpdate"
    @close="closeSearchPopup"
    @perform-search="performSearch"
  />

  <header class="main-header">
    <TheTopBar />

    <div
      :class="[
        'smart-nav-wrapper',
        { 'is-hidden': isHidden, 'is-sticky': isSticky },
      ]"
    >
      <div class="middle-bar">
        <div class="container">
          <div class="nav-content">
            <div class="logo-section">
              <button
                @click="toggleMobileMenu"
                class="menu-toggle-btn"
                aria-label="قائمة التنقل"
              >
                <Icon name="ph:list" />
              </button>
              <NuxtLink to="/">
                <div class="image">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    class="logo-icon"
                    loading="eager"
                    fetchpriority="high"
                  />
                </div>
              </NuxtLink>
            </div>

            <!-- ✅ Desktop Search — بدون @mouseleave على الحاوية -->
            <div
              v-if="!isMobileValue"
              class="search-container"
              @mouseenter="onSearchAreaEnter"
              @mouseleave="onSearchAreaLeave"
            >
              <input
                v-model="desktopSearchInput"
                type="text"
                placeholder="ابحث عن منتجات، ماركات، أقسام..."
                class="search-input"
                @keyup.enter="goToFullResults"
                @input="onDesktopSearchInput"
                @focus="onDesktopFocus"
              />
              <Icon name="ph:magnifying-glass-light" class="search-icon" />
              <button
                v-if="desktopSearchInput"
                class="search-clear-desktop"
                @click="clearDesktopSearch"
                aria-label="مسح البحث"
              >
                <Icon name="ph:x" />
              </button>

              <!-- ✅ Dropdown — بدون فجوة، متصل بالحاوية -->
              <Transition name="dropdown">
                <div
                  v-if="showDesktopResults && desktopSearchInput.trim()"
                  class="desktop-results-dropdown"
                  @mouseenter="cancelHideDropdown"
                  @mouseleave="scheduleHideDropdown"
                >
                  <div v-if="desktopLoading" class="dd-loading">
                    <div class="mini-spinner"></div>
                    <span>جاري البحث...</span>
                  </div>

                  <div
                    v-else-if="desktopHasSearched && !desktopResults.length"
                    class="dd-empty"
                  >
                    <p>لا توجد نتائج لـ "{{ desktopSearchInput }}"</p>
                  </div>

                  <template v-else-if="desktopResults.length">
                    <NuxtLink
                      v-for="product in desktopResults"
                      :key="product.id"
                      :to="`/product/${product.slug || product.id}`"
                      class="dd-item"
                      @click="
                        showDesktopResults = false;
                        desktopSearchInput = '';
                      "
                    >
                      <img
                        :src="product.mainImage || '/images/placeholder.jpg'"
                        :alt="productsStore.getProductName(product)"
                        class="dd-img"
                      />
                      <div class="dd-info">
                        <span class="dd-name">{{
                          productsStore.getProductName(product)
                        }}</span>
                        <span class="dd-price">
                          {{
                            parseFloat(
                              product.baseDiscountPrice ||
                                product.basePrice ||
                                0,
                            ).toLocaleString("en-EG")
                          }}
                          ج.م
                        </span>
                      </div>
                    </NuxtLink>
                    <button class="dd-view-all" @click="goToFullResults">
                      عرض كل النتائج ({{ desktopTotalResults }})
                    </button>
                  </template>
                </div>
              </Transition>
            </div>

            <button
              @click="openSearchPopup"
              class="search-icon-mobile"
              aria-label="بحث"
            >
              <Icon name="ph:magnifying-glass" class="search-icon-mobile-svg" />
            </button>

            <TheDesktopActionIcons />
          </div>
        </div>
      </div>
      <TheDesktopNav v-if="!isMobileValue" />
    </div>

    <TheMobileActionIcons />
  </header>

  <TheMobileNav
    v-if="isMobileValue"
    :mobile-menu-open="mobileMenuOpen"
    :active-accordion="activeAccordion"
    :active-sub-accordion="activeSubAccordion"
    @toggle-accordion="toggleAccordion"
    @toggle-sub-accordion="toggleSubAccordion"
    @close-mobile-menu="closeMobileMenu"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useBreakpoints } from "@vueuse/core";
import { useProductsStore } from "@/stores/products";
import TheTopBar from "@/components/header/TheTopBar.vue";
import TheDesktopNav from "@/components/header/TheDesktopNav.vue";
import TheMobileNav from "@/components/header/TheMobileNav.vue";
import TheSearchPopup from "@/components/header/TheSearchPopup.vue";
import TheDesktopActionIcons from "@/components/header/TheDesktopActionIcons.vue";
import TheMobileActionIcons from "@/components/header/TheMobileActionIcons.vue";
import TheMobileNavOverlay from "@/components/header/TheMobileNavOverlay.vue";

const productsStore = useProductsStore();

// === State ===
const isSticky = ref(false);
const isHidden = ref(false);
const isMounted = ref(false);
const mobileMenuOpen = ref(false);
const activeAccordion = ref(null);
const activeSubAccordion = ref(null);
const searchPopupOpen = ref(false);
const searchQuery = ref("");
const searchInputRef = ref(null);
const desktopSearchInput = ref("");
let lastScrollPosition = 0;

// === Desktop Live Search State ===
const desktopResults = ref([]);
const desktopTotalResults = ref(0);
const desktopLoading = ref(false);
const desktopHasSearched = ref(false);
const showDesktopResults = ref(false);
let desktopDebounce = null;
let hideDropdownTimer = null;

// === Breakpoints ===
const customBreakpoints = { mobile: 870, tablet: 1024, desktop: 1280 };
const breakpoints = useBreakpoints(customBreakpoints);
const isMobileDevice = breakpoints.smaller("mobile");

const isMobileValue = computed(() => {
  if (!isMounted.value) return false;
  return isMobileDevice.value;
});

// === Scroll ===
const handleScroll = () => {
  if (typeof window === "undefined") return;
  const currentScrollPosition = window.scrollY;
  isSticky.value = currentScrollPosition > 45;
  if (
    currentScrollPosition > lastScrollPosition &&
    currentScrollPosition > 150
  ) {
    isHidden.value = true;
  } else if (currentScrollPosition < lastScrollPosition) {
    isHidden.value = false;
  }
  lastScrollPosition = currentScrollPosition;
};

// === Mobile Menu ===
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? "hidden" : "";
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  activeAccordion.value = null;
  activeSubAccordion.value = null;
  document.body.style.overflow = "";
};

const toggleAccordion = (category) => {
  activeAccordion.value = activeAccordion.value === category ? null : category;
  activeSubAccordion.value = null;
};

const toggleSubAccordion = (subcategory) => {
  activeSubAccordion.value =
    activeSubAccordion.value === subcategory ? null : subcategory;
};

// === ✅ Desktop Dropdown Hover Logic (إصلاح مشكلة الاختفاء) ===
const onSearchAreaEnter = () => {
  clearTimeout(hideDropdownTimer);
};

const onSearchAreaLeave = () => {
  scheduleHideDropdown();
};

const cancelHideDropdown = () => {
  clearTimeout(hideDropdownTimer);
};

const scheduleHideDropdown = () => {
  clearTimeout(hideDropdownTimer);
  hideDropdownTimer = setTimeout(() => {
    showDesktopResults.value = false;
  }, 200); // تأخير 200ms قبل الإخفاء
};

// === ✅ Desktop Live Search — يستخدم searchProducts (endpoint عام) ===
const onDesktopSearchInput = () => {
  clearTimeout(desktopDebounce);
  const term = desktopSearchInput.value.trim();

  if (!term) {
    desktopResults.value = [];
    desktopTotalResults.value = 0;
    desktopHasSearched.value = false;
    desktopLoading.value = false;
    showDesktopResults.value = false;
    return;
  }

  desktopLoading.value = true;
  showDesktopResults.value = true;

  desktopDebounce = setTimeout(async () => {
    try {
      const result = await productsStore.searchProducts(term, 5);
      desktopResults.value = result.data;
      desktopTotalResults.value = result.total;
    } catch (err) {
      console.error("Desktop live search error:", err);
      desktopResults.value = [];
    } finally {
      desktopLoading.value = false;
      desktopHasSearched.value = true;
    }
  }, 350);
};

const onDesktopFocus = () => {
  if (desktopSearchInput.value.trim() && desktopHasSearched.value) {
    showDesktopResults.value = true;
  }
};

const goToFullResults = () => {
  const term = desktopSearchInput.value.trim();
  if (!term) return;
  showDesktopResults.value = false;
  navigateTo({ path: "/products", query: { search: term } });
};

const clearDesktopSearch = () => {
  desktopSearchInput.value = "";
  desktopResults.value = [];
  desktopTotalResults.value = 0;
  desktopHasSearched.value = false;
  showDesktopResults.value = false;
};

// === ✅ Popup Search (Mobile) ===
const openSearchPopup = () => {
  searchPopupOpen.value = true;
  document.body.style.overflow = "hidden";
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus();
  });
};

const closeSearchPopup = () => {
  searchPopupOpen.value = false;
  searchQuery.value = "";
  document.body.style.overflow = "";
};

const onSearchQueryUpdate = (value) => {
  searchQuery.value = value;
};

const performSearch = () => {
  const term = searchQuery.value.trim();
  if (term) {
    closeSearchPopup();
    navigateTo({ path: "/products", query: { search: term } });
  }
};

// === Lifecycle ===
onMounted(() => {
  isMounted.value = true;
  window.addEventListener("scroll", handleScroll, { passive: true });

  const handleClickOutside = (event) => {
    if (
      mobileMenuOpen.value &&
      !event.target.closest(".mobile-menu") &&
      !event.target.closest(".menu-toggle-btn")
    ) {
      closeMobileMenu();
    }
    if (
      searchPopupOpen.value &&
      !event.target.closest(".search-popup") &&
      !event.target.closest(".search-icon-mobile")
    ) {
      closeSearchPopup();
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === "Escape") {
      if (searchPopupOpen.value) closeSearchPopup();
      if (mobileMenuOpen.value) closeMobileMenu();
      showDesktopResults.value = false;
    }
  };

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  document.body.style.overflow = "";
  clearTimeout(desktopDebounce);
  clearTimeout(hideDropdownTimer);
});
</script>

<style scoped lang="scss">
.smart-nav-wrapper {
  width: 100%;
  transition: transform 0.3s ease-in-out;
  will-change: transform;
}
.is-sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--bg-body);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.is-sticky.is-hidden {
  transform: translateY(-100%);
}

.main-header {
  background-color: var(--bg-body);
  box-shadow: var(--shadow-1);
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.middle-bar {
  background-color: var(--color-green-white);
  padding: 10px 0;
  border-bottom: 1px solid var(--color-green-light-active);
}

.menu-toggle-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-green-primary);
  font-size: 28px;
}
@media (max-width: 870px) {
  .menu-toggle-btn {
    display: block;
  }
}

/* ── Desktop Search ── */
.search-container {
  position: relative;
  width: 45%;
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 40px;
  border: 1.5px solid var(--color-green-primary);
  border-radius: 30px;
  background-color: transparent;
  text-align: right;
  outline: none;
  font-size: 15px;
  transition: box-shadow 0.3s;
  &:focus {
    box-shadow: 0 0 8px var(--color-green-light-active);
  }
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-green-primary);
  font-size: 22px;
  pointer-events: none;
}

.search-clear-desktop {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.08);
  }
}

/* ── ✅ Desktop Dropdown — بدون فجوة، متصل بالحاوية ── */
.desktop-results-dropdown {
  position: absolute;
  top: 100%; /* ✅ بدون فجوة — متصل مباشرة */
  left: 0;
  right: 0;
  margin-top: 4px; /* فجوة بصرية صغيرة فقط */
  background: white;
  border-radius: 0 0 14px 14px; /* زوايا سفلية فقط */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-top: none; /* ✅ بدون حدود علوية — يبدو كامتداد للـ input */
  padding: 8px;
  z-index: 1100;
  max-height: 400px;
  overflow-y: auto;
}

.dd-loading,
.dd-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.mini-spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.15);
  border-top-color: var(--color-green-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.15s;
  &:hover {
    background: rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.06);
  }
}

.dd-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
  flex-shrink: 0;
}

.dd-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dd-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd-price {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-green-primary);
}

.dd-view-all {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 6px;
  background: var(--color-green-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: var(--color-green-hover);
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Mobile Search Icon ── */
.search-icon-mobile {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--color-green-primary);
  font-size: 28px;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
}
.search-icon-mobile-svg {
  font-size: 28px;
}
@media (max-width: 870px) {
  .search-icon-mobile {
    display: block;
  }
  .search-container {
    display: none;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
  color: var(--color-green-primary);
  img {
    width: 125px;
  }
}

.search-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 1;
  visibility: visible;
  transition: all 0.3s ease;
  z-index: 2100;
  cursor: pointer;
}
</style>
