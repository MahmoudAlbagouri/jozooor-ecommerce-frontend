// stores/wishlist.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useWishlistStore = defineStore("wishlist", () => {
  const api = useApi();

  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const wishlistCount = computed(() => items.value.length);

  const isInWishlist = (productId) => {
    return items.value.some((item) => item.product?.id === productId);
  };

  const fetchWishlist = async () => {
    loading.value = true;
    try {
      const response = await api("/wishlist");
      if (response.success) {
        items.value = response.data;
      }
    } catch (err) {
      error.value = "فشل في تحميل المفضلة";
      console.error("Fetch Wishlist Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const toggleWishlist = async (productId) => {
    try {
      const response = await api(`/wishlist/${productId}`, {
        method: "POST",
      });

      if (response.success) {
        await fetchWishlist();
        return {
          success: true,
          added: response.data.added,
          message: response.data.message,
        };
      }
    } catch (err) {
      console.error("Wishlist Toggle Error:", err);
      return { success: false };
    }
  };

  return {
    items,
    loading,
    error,
    wishlistCount,
    fetchWishlist,
    toggleWishlist,
    isInWishlist,
  };
});
