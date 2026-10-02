/** Producto como lo entrega la API */
export interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  /** Texto con 2 decimales */
  price: string;
  /** Fechas ISO 8601 en UTC */
  created_at: string;
  updated_at: string;
}

/** Datos para crear un producto */
export interface ProductInput {
  name: string;
  brand: string;
  price: number;
}
