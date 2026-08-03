<template>
  <div class="search-popup">
    <div class="search-popup-content">
      <!-- ✅ Header محسّن -->
      <div class="popup-header">
        <div class="header-title">
          <Icon name="ph:magnifying-glass" class="header-icon" />
          <span>البحث في متجر جذور</span>
        </div>
        <button
          @click="close"
          class="search-close-btn"
          aria-label="إغلاق البحث"
        >
          <Icon name="ph:x" class="close-icon" />
        </button>
      </div>

      <!-- ✅ حقل البحث المحسّن -->
      <div class="search-input-wrapper">
        <div class="input-icon-right">
          <Icon name="ph:magnifying-glass" class="search-popup-icon" />
        </div>

        <input
          ref="inputRef"
          v-model="localQuery"
          type="text"
          placeholder="ابحث عن منتجات، ماركات، أو أقسام..."
          class="search-popup-input"
          @keyup.enter="goToFullResults"
          @input="onInput"
        />

        <Transition name="fade">
          <button
            v-if="localQuery"
            class="popup-clear-btn"
            @click="clearSearch"
            aria-label="مسح البحث"
          >
            <Icon name="ph:x-circle-fill" />
          </button>
        </Transition>
      </div>

      <!-- ✅ منطقة النتائج -->
      <div class="search-results-area">
        <!-- حالة التحميل -->
        <div v-if="isLoading" class="results-loading">
          <div class="loader-dots"><span></span><span></span><span></span></div>
          <p>جاري البحث في المنتجات...</p>
        </div>

        <!-- لا توجد نتائج -->
        <div v-else-if="hasSearched && !results.length" class="no-results">
          <div class="empty-illustration">
            <Icon name="ph:package" class="empty-icon" />
            <div class="empty-circle"></div>
          </div>
          <h3 class="no-results-title">عذراً، لا توجد نتائج</h3>
          <p class="no-results-hint">
            لم نعثر على منتجات تطابق "{{ localQuery }}"<br />جرّب كلمات بحث أخرى
            أو تصفح الأقسام
          </p>
        </div>

        <!-- قائمة النتائج -->
        <div v-else-if="results.length" class="results-list">
          <div class="results-header">
            <span class="results-count">{{ totalResults }} نتيجة وجدت</span>
          </div>

          <NuxtLink
            v-for="(product, index) in results"
            :key="product.id"
            :to="`/product/${product.slug || product.id}`"
            class="result-item"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="onResultClick"
          >
            <div class="result-img-wrapper">
              <img
                :src="product.mainImage || '/images/placeholder.jpg'"
                :alt="getProductName(product)"
                loading="lazy"
              />
              <div class="img-overlay"></div>
            </div>

            <div class="result-info">
              <h4 class="result-name">{{ getProductName(product) }}</h4>
              <div class="result-meta">
                <div class="result-price-row">
                  <span v-if="product.baseDiscountPrice" class="price-current">
                    {{ formatPrice(product.baseDiscountPrice) }}
                    <small>ج.م</small>
                  </span>
                  <span
                    class="price-old"
                    :class="{ 'has-discount': product.baseDiscountPrice }"
                  >
                    {{ formatPrice(product.basePrice) }} <small>ج.م</small>
                  </span>
                </div>
                <span
                  v-if="product.baseStock <= 5 && product.baseStock > 0"
                  class="stock-badge low"
                >
                  باقي {{ product.baseStock }} فقط
                </span>
              </div>
            </div>

            <div class="result-action">
              <Icon name="ph:arrow-left" class="action-arrow" />
            </div>
          </NuxtLink>

          <button class="view-all-btn" @click="goToFullResults">
            <span>عرض جميع النتائج ({{ totalResults }})</span>
            <Icon name="ph:arrow-square-left" />
          </button>
        </div>

        <!-- الحالة الابتدائية -->
        <div v-else class="search-hint">
          <div class="hint-icon-wrapper">
            <Icon name="ph:sparkle" class="hint-icon" />
          </div>
          <p class="hint-text">ابدأ بالكتابة للبحث عن منتجاتنا الطبيعية</p>
          <div class="popular-searches">
            <span class="popular-label">بحث شائع:</span>
            <button class="tag" @click="setSearch('سماق')">سماق</button>
            <button class="tag" @click="setSearch('زعتر')">زعتر</button>
            <button class="tag" @click="setSearch('عسل')">عسل</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useProductsStore } from "@/stores/products";

const props = defineProps({
  searchQuery: String,
  searchInputRef: Object,
});

const emit = defineEmits(["close", "perform-search", "update:search-query"]);

const productsStore = useProductsStore();
const inputRef = ref(null);
const localQuery = ref(props.searchQuery || "");
const results = ref([]);
const totalResults = ref(0);
const isLoading = ref(false);
const hasSearched = ref(false);
let debounceTimer = null;

const getProductName = (product) => {
  return productsStore.getProductName(product);
};

const formatPrice = (price) => {
  return parseFloat(price || 0).toLocaleString("en-EG");
};

const setSearch = (term) => {
  localQuery.value = term;
  onInput();
  nextTick(() => inputRef.value?.focus());
};

const onInput = () => {
  emit("update:search-query", localQuery.value);
  clearTimeout(debounceTimer);

  const term = localQuery.value.trim();
  if (!term) {
    results.value = [];
    totalResults.value = 0;
    hasSearched.value = false;
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  debounceTimer = setTimeout(async () => {
    try {
      const result = await productsStore.searchProducts(term, 6);
      results.value = result.data;
      totalResults.value = result.total;
    } catch (err) {
      console.error("Live search error:", err);
      results.value = [];
      totalResults.value = 0;
    } finally {
      isLoading.value = false;
      hasSearched.value = true;
    }
  }, 350);
};

const clearSearch = () => {
  localQuery.value = "";
  emit("update:search-query", "");
  results.value = [];
  totalResults.value = 0;
  hasSearched.value = false;
  nextTick(() => inputRef.value?.focus());
};

const goToFullResults = () => {
  if (!localQuery.value.trim()) return;
  emit("perform-search");
};

const onResultClick = () => {
  emit("close");
};

const close = () => emit("close");

onMounted(() => {
  nextTick(() => inputRef.value?.focus());
});
</script>

<style scoped lang="scss">
/* ═══════════════════════════════════════════
   Popup Container
═══════════════════════════════════════════ */
.search-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 94%;
  max-width: 560px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 2200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popupEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popupEnter {
  from {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.search-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ═══════════════════════════════════════════
   Header
═══════════════════════════════════════════ */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(to bottom, #fafffe, #ffffff);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);

  .header-icon {
    color: var(--color-green-primary);
    font-size: 20px;
  }
}

.search-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;

  &:hover {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    transform: rotate(90deg);
  }
}

/* ═══════════════════════════════════════════
   Search Input
═══════════════════════════════════════════ */
.search-input-wrapper {
  position: relative;
  padding: 20px 24px;
  background: #ffffff;
}

.input-icon-right {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 2;
}

.search-popup-icon {
  color: var(--color-green-primary);
  font-size: 20px;
  opacity: 0.7;
}

.search-popup-input {
  width: 100%;
  padding: 16px 48px 16px 44px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  background-color: #f8fafc;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-main);
  outline: none;
  transition: all 0.3s ease;
  direction: rtl;
  text-align: right;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  &:focus {
    border-color: var(--color-green-primary);
    background-color: #ffffff;
    box-shadow:
      0 0 0 4px rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.1),
      inset 0 2px 4px rgba(0, 0, 0, 0);
  }
}

.popup-clear-btn {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 20px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;

  &:hover {
    color: #dc2626;
    transform: translateY(-50%) scale(1.1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ═══════════════════════════════════════════
   Results Area
═══════════════════════════════════════════ */
.search-results-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 24px 24px;
  background: #ffffff;

  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-green-primary);
  }
}

/* ── Loading State ── */
.results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 16px;
  color: var(--text-muted);

  p {
    font-size: 14px;
    font-weight: 500;
  }
}

.loader-dots {
  display: flex;
  gap: 6px;

  span {
    width: 8px;
    height: 8px;
    background: var(--color-green-primary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* ── No Results State ── */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-illustration {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-icon {
  font-size: 40px;
  color: var(--color-green-primary);
  opacity: 0.4;
  z-index: 2;
}

.empty-circle {
  position: absolute;
  inset: 0;
  background: rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.08);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.2;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

.no-results-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.no-results-hint {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 280px;
}

/* ── Hint State (Initial) ── */
.search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.hint-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(
    135deg,
    rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.1),
    rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.05)
  );
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.hint-icon {
  font-size: 28px;
  color: var(--color-green-primary);
}

.hint-text {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 500;
  margin-bottom: 24px;
}

.popular-searches {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.popular-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.tag {
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-green-primary);
    color: white;
    border-color: var(--color-green-primary);
    transform: translateY(-1px);
  }
}

/* ── Results List ── */
.results-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e2e8f0;
}

.results-count {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  animation: slideUp 0.3s ease backwards;

  &:hover {
    background: #fafffe;
    border-color: rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.15);
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);

    .result-img-wrapper img {
      transform: scale(1.05);
    }

    .action-arrow {
      opacity: 1;
      transform: translateX(-4px);
      color: var(--color-green-primary);
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-img-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #f1f5f9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.05), transparent);
    pointer-events: none;
  }
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price-current {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-green-primary);

  small {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.8;
  }
}

.price-old {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: line-through;

  &.has-discount {
    color: #94a3b8;
  }

  small {
    font-size: 10px;
  }
}

.stock-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;

  &.low {
    background: #fff7ed;
    color: #ea580c;
    border: 1px solid #ffedd5;
  }
}

.result-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-arrow {
  font-size: 18px;
  color: #cbd5e1;
  opacity: 0;
  transform: translateX(4px);
  transition: all 0.25s ease;
}

/* ── View All Button ── */
.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  margin-top: 16px;
  background: linear-gradient(
    135deg,
    var(--color-green-primary),
    var(--color-green-hover)
  );
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px
      rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.35);
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
  }
}

/* ═══════════════════════════════════════════
   Responsive
═══════════════════════════════════════════ */
@media (max-width: 480px) {
  .search-popup {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    top: 0;
    left: 0;
    transform: none;
    border-radius: 0;
    animation: slideUpMobile 0.3s ease;
  }

  @keyframes slideUpMobile {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .popup-header {
    padding: 16px 20px;
  }

  .search-input-wrapper {
    padding: 16px 20px;
  }

  .search-results-area {
    padding: 0 20px 20px;
  }

  .result-item {
    padding: 10px;
    gap: 12px;
  }

  .result-img-wrapper {
    width: 56px;
    height: 56px;
  }
}
</style>
