// stores/cart.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCartStore = defineStore("cart", () => {
  const api = useApi();

  const items = ref([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref(null);

  const cartItemsCount = computed(() => items.value.length);
  const totalQuantity = computed(() =>
    items.value.reduce((acc, item) => acc + item.quantity, 0),
  );

  const fetchCart = async () => {
    loading.value = true;
    try {
      const response = await api("/cart");
      if (response.success) {
        items.value = response.data.items;
        total.value = response.data.total;
      }
    } catch (err) {
      error.value = err.data?.message || "حدث خطأ أثناء جلب السلة";
      console.error("Fetch Cart Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    loading.value = true;

    const tempId = `temp-${Date.now()}`;
    const existingItem = items.value.find(
      (i) => i.productId === productId || i.product?.id === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.value.push({ id: tempId, productId, quantity, isTemp: true });
    }

    try {
      const response = await api("/cart", {
        method: "POST",
        body: { productId, quantity, variantId },
      });

      if (response.success) {
        await fetchCart();
        return { success: true, message: response.message };
      }
    } catch (err) {
      items.value = items.value.filter((i) => i.id !== tempId);
      if (existingItem) existingItem.quantity -= quantity;
      console.error("Add to Cart Error:", err);
      return { success: false, error: err.data?.message };
    } finally {
      loading.value = false;
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const response = await api(`/cart/${itemId}`, {
        method: "PATCH",
        body: { quantity: newQuantity },
      });
      if (response.success) {
        const item = items.value.find((i) => i.id === itemId);
        if (item) item.quantity = newQuantity;
        await fetchCart();
      }
    } catch (err) {
      console.error("Update Quantity Error:", err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await api(`/cart/${itemId}`, {
        method: "DELETE",
      });
      if (response.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Remove Item Error:", err);
    }
  };

  const clearCart = async () => {
    try {
      const response = await api("/cart", {
        method: "DELETE",
      });
      if (response.success) {
        items.value = [];
        total.value = 0;
      }
    } catch (err) {
      console.error("Clear Cart Error:", err);
    }
  };

  return {
    items,
    total,
    loading,
    error,
    cartItemsCount,
    totalQuantity,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
});
