/**
 * Reglas de validación del producto.
 * Deben coincidir con StoreProductRequest en el backend.
 */
export const PRODUCT_RULES = {
  nameMaxLength: 100,
  brandMaxLength: 60,
  priceMin: 0.01,
  priceMax: 999.99,
} as const;
