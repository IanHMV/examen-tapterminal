import { Product } from '../core/models/product.model';

/**
 * Datos de prueba compartidos por los tests.
 * Solo los importan los archivos .spec.ts: no forman parte de la app.
 */
export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '6abf11b87c2123d8c1054972',
    code: 'PRD-0003',
    name: 'Guantes de carga de piel',
    brand: 'Urrea',
    price: '119.00',
    created_at: '2026-10-01T18:30:00+00:00',
    updated_at: '2026-10-01T18:30:00+00:00',
    ...overrides,
  };
}
