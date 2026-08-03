<template>
  <div class="account-layout">
    <aside class="sidebar">
      <AccountSidebar />
    </aside>

    <main class="main-content">
      <div class="account-card">
        <h1 class="card-title">
          <Icon name="ph:shopping-cart" class="title-icon" />
          سلة المنتجات
        </h1>

        <!-- تحميل -->
        <div
          v-if="cartStore.loading && !cartStore.items.length"
          class="loading-state"
        >
          <div class="spinner"></div>
          <p>جاري تحميل محتويات السلة...</p>
        </div>

        <!-- سلة فارغة -->
        <div v-else-if="cartStore.items.length === 0" class="empty-state">
          <div class="empty-visual">
            <Icon name="ph:shopping-cart-simple" class="empty-icon" />
            <div class="empty-ring"></div>
          </div>
          <h3 class="empty-title">سلتك فارغة حالياً</h3>
          <p class="empty-sub">ابدأ التسوق واستمتع بأفضل العروض</p>
          <NuxtLink to="/products" class="go-btn">
            <Icon name="ph:storefront" />
            تصفح المنتجات
          </NuxtLink>
        </div>

        <!-- المنتجات -->
        <div v-else class="cart-body">
          <div class="cart-items">
            <TransitionGroup name="cart-item-anim" tag="div" class="items-list">
              <div
                v-for="(item, idx) in cartStore.items"
                :key="item.id"
                class="cart-item"
                :style="{ animationDelay: `${idx * 60}ms` }"
              >
                <!-- صورة + معلومات -->
                <div class="item-left">
                  <div class="item-img">
                    <img
                      :src="
                        item.product?.mainImage ||
                        '/images/products/placeholder.jpg'
                      "
                      :alt="item.product?.name"
                    />
                  </div>
                  <div class="item-info">
                    <h3 class="item-name">
                      {{ item.product?.name || "منتج غير معروف" }}
                    </h3>
                    <p class="item-unit-price">
                      <span class="price-val">{{ item.product?.price }}</span>
                      <span class="price-cur">ج.م</span>
                      / قطعة
                    </p>
                    <p class="item-subtotal">
                      الإجمالي:
                      <strong
                        >{{
                          (item.product?.price * item.quantity).toLocaleString()
                        }}
                        ج.م</strong
                      >
                    </p>
                  </div>
                </div>

                <!-- تحكم الكمية + حذف -->
                <div class="item-right">
                  <QuantityInput
                    :modelValue="item.quantity"
                    :min="1"
                    :max="item.product?.stock || 50"
                    @update:modelValue="
                      (v) => cartStore.updateQuantity(item.id, v)
                    "
                  />
                  <button
                    class="remove-btn"
                    @click="cartStore.removeItem(item.id)"
                    :disabled="cartStore.loading"
                    aria-label="حذف"
                  >
                    <Icon name="ph:trash" class="remove-icon" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- الإجمالي -->
          <div class="cart-summary">
            <div class="summary-row">
              <span>إجمالي المنتجات ({{ cartStore.items.length }})</span>
              <span>{{ cartStore.total.toLocaleString() }} ج.م</span>
            </div>
            <div class="summary-row shipping">
              <span>الشحن</span>
              <span class="free-ship">
                <Icon name="ph:truck" />
                مجاني
              </span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>الإجمالي الكلي</span>
              <span class="total-val"
                >{{ cartStore.total.toLocaleString() }} ج.م</span
              >
            </div>

            <div class="summary-actions">
              <button class="btn-checkout" @click="handleCheckout">
                <Icon name="ph:credit-card" />
                إتمام الشراء
              </button>
              <button class="btn-clear" @click="cartStore.clearCart">
                <Icon name="ph:trash-simple" />
                مسح السلة
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCartStore } from "@/stores/cart";
import AccountSidebar from "@/components/base/AccountSidebar.vue";
import QuantityInput from "@/components/base/QuantityInput.vue";

definePageMeta({
  middleware: ["guest"],
  requiresAuth: true,
});

useSeoMeta({
  title: "سلة المشتريات | متجر جذور",
  description: "راجع المنتجات في سلتك وأتمم عملية الشراء بسهولة وأمان.",
});

const cartStore = useCartStore();
onMounted(() => cartStore.fetchCart());
const handleCheckout = () => navigateTo("/checkout");
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
  min-height: 340px;
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
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 56px;
  color: var(--color-green-primary);
  opacity: 0.3;
  position: relative;
  z-index: 1;
}

.empty-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(var(--color-green-primary-rgb, 45, 125, 75), 0.2);
  animation: ringRotate 12s linear infinite;
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

/* ── Cart Body ── */
.cart-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

/* ── Items ── */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  animation: itemIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    transform: translateX(-2px);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
  }
}

@keyframes itemIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* TransitionGroup */
.cart-item-anim-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-item-anim-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}
.cart-item-anim-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.cart-item-anim-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.item-img {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.item-info {
  min-width: 0;
}
.item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}
.item-unit-price {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
  .price-val {
    font-weight: 700;
    color: var(--color-green-primary);
    font-size: 15px;
  }
  .price-cur {
    font-size: 11px;
  }
}
.item-subtotal {
  font-size: 13px;
  color: var(--text-muted);
  strong {
    color: var(--text-main);
  }
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
  @media (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(239, 68, 68, 0.07);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  .remove-icon {
    font-size: 15px;
  }
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* ── ملخص السلة ── */
.cart-summary {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 12px;
  direction: rtl;

  &.shipping {
    color: var(--text-muted);
  }
  &.total {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 0;
  }
}

.free-ship {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #16a34a;
  font-weight: 600;
  font-size: 13px;
}

.total-val {
  color: var(--color-green-primary);
  font-size: 20px;
}

.summary-divider {
  height: 1px;
  background: linear-gradient(
    to left,
    transparent,
    rgba(0, 0, 0, 0.06),
    transparent
  );
  margin: 12px 0 16px;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.btn-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 15px;
  background: linear-gradient(
    135deg,
    var(--color-green-primary),
    var(--color-green-hover)
  );
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: all 0.25s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    filter: brightness(1.05);
  }
}

.btn-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #dc2626;
  border: 1.5px solid rgba(239, 68, 68, 0.2);
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  &:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
  }
}
</style>
