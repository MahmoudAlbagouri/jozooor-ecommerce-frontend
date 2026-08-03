import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useProductsStore = defineStore("products", () => {
  const api = useApi();
  const { locale } = useI18n();

  // --- State ---
  const products = ref([]);
  const meta = ref(null);
  const filters = ref(null);
  const currentProduct = ref(null);
  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref(null);

  // --- Active Filters State ---
  const activeFilters = ref({
    searchTerm: "",
    categoryId: "",
    brandId: "",
    colorId: "",
    sizeId: "",
    minPrice: "",
    maxPrice: "",
    page: 1,
    limit: 20,
  });

  // --- Getters ---
  const getProductName = computed(() => {
    return (product) => {
      const currentLang = locale.value;
      if (!product?.translations?.length)
        return product?.name || product?.slug || "";
      const t = product.translations.find(
        (t) => t.languageCode === currentLang,
      );
      return t ? t.name : product.translations[0]?.name || "";
    };
  });

  const getProductPrice = computed(() => (product) => {
    return parseFloat(product?.baseDiscountPrice || product?.basePrice || 0);
  });

  const getDiscountPercent = computed(() => (product) => {
    const base = parseFloat(product?.basePrice || 0);
    const disc = parseFloat(product?.baseDiscountPrice || 0);
    if (!base || !disc || disc >= base) return null;
    return Math.round(((base - disc) / base) * 100);
  });

  const hasActiveFilters = computed(() => {
    const f = activeFilters.value;
    return !!(
      f.searchTerm ||
      f.categoryId ||
      f.brandId ||
      f.colorId ||
      f.sizeId ||
      f.minPrice ||
      f.maxPrice
    );
  });

  // --- Actions ---
  async function fetchProducts(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const mergedParams = {
        ...activeFilters.value,
        ...params,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(mergedParams).filter(
          ([_, v]) => v !== "" && v !== null && v !== undefined,
        ),
      );

      if (params.page !== undefined) activeFilters.value.page = params.page;

      const response = await api("/products", { params: cleanParams });
      if (response.success) {
        products.value = response.data.data || response.data;
        meta.value = response.data.meta;
        filters.value = response.data.filters;
      }
    } catch (err) {
      error.value = "فشل تحميل المنتجات";
      console.error("fetchProducts error:", err);
    } finally {
      loading.value = false;
    }
  }

  // ✅ بحث عام — لا يحتاج تسجيل دخول
  // يستخدم endpoint /products/search?q= مباشرة عبر $fetch
  async function searchProducts(term, limit = 6) {
    try {
      const config = useRuntimeConfig();
      const nuxtApp = useNuxtApp();
      const currentLocale =
        nuxtApp.$i18n?.locale?.value || locale.value || "ar";

      const response = await $fetch("/products/search", {
        baseURL: config.public.apiBase,
        params: { q: term },
        headers: {
          "Accept-Language": currentLocale,
          "Content-Type": "application/json",
        },
      });

      if (response.success) {
        const data = response.data || [];
        return {
          data: data.slice(0, limit),
          total: data.length,
        };
      }
      return { data: [], total: 0 };
    } catch (err) {
      console.error("searchProducts error:", err);
      return { data: [], total: 0 };
    }
  }

  async function applyFilters(newFilters = {}) {
    Object.assign(activeFilters.value, newFilters, { page: 1 });
    await fetchProducts();
  }

  function resetFilters() {
    activeFilters.value = {
      searchTerm: "",
      categoryId: "",
      brandId: "",
      colorId: "",
      sizeId: "",
      minPrice: "",
      maxPrice: "",
      page: 1,
      limit: 20,
    };
    fetchProducts();
  }

  async function fetchProduct(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api(`/products/${id}`);
      if (response.success) {
        currentProduct.value = response.data;
        return response.data;
      }
      return null;
    } catch (err) {
      error.value = "فشل تحميل المنتج";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createProduct(payload) {
    actionLoading.value = true;
    try {
      const response = await api("/products", {
        method: "POST",
        body: payload,
      });
      if (response.success) {
        await fetchProducts();
        return { success: true, data: response.data };
      }
      return { success: false };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateProduct(id, payload) {
    actionLoading.value = true;
    try {
      const response = await api(`/products/${id}`, {
        method: "PATCH",
        body: payload,
      });
      if (response.success) {
        await fetchProducts();
        return { success: true, data: response.data };
      }
      return { success: false };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      actionLoading.value = false;
    }
  }

  async function deleteProduct(id) {
    actionLoading.value = true;
    try {
      const response = await api(`/products/${id}`, { method: "DELETE" });
      if (response.success) {
        products.value = products.value.filter((p) => p.id !== id);
        return { success: true };
      }
      return { success: false };
    } finally {
      actionLoading.value = false;
    }
  }

  async function duplicateProduct(id) {
    actionLoading.value = true;
    try {
      const response = await api(`/products/${id}/duplicate`, {
        method: "POST",
      });
      if (response.success) {
        await fetchProducts();
        return { success: true };
      }
      return { success: false };
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    products,
    meta,
    filters,
    currentProduct,
    loading,
    actionLoading,
    error,
    activeFilters,
    hasActiveFilters,
    getProductName,
    getProductPrice,
    getDiscountPercent,
    fetchProducts,
    searchProducts,
    applyFilters,
    resetFilters,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
  };
});
