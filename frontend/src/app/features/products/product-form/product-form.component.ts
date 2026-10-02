import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { PRODUCT_RULES } from '../../../core/constants/product-rules';
import { ValidationErrorResponse } from '../../../core/models/api.model';
import { Product, ProductInput } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';

/** Al menos un carácter que no sea espacio (la API recorta los espacios). */
const NOT_BLANK = /\S/;

/** Número positivo con máximo 2 decimales. */
const PRICE_FORMAT = /^\d+(\.\d{1,2})?$/;

/**
 * Alta de productos. El código y la fecha de creación los genera la API.
 */
@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly productService = inject(ProductService);

  protected readonly rules = PRODUCT_RULES;
  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly saving = signal(false);
  protected readonly createdProduct = signal<Product | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      Validators.pattern(NOT_BLANK),
      Validators.maxLength(PRODUCT_RULES.nameMaxLength),
    ]),
    brand: this.fb.control('', [
      Validators.required,
      Validators.pattern(NOT_BLANK),
      Validators.maxLength(PRODUCT_RULES.brandMaxLength),
    ]),
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(PRODUCT_RULES.priceMin),
      Validators.max(PRODUCT_RULES.priceMax),
      Validators.pattern(PRICE_FORMAT),
    ]),
  });

  protected submit(): void {
    // Muestra los errores de todos los campos, aunque el usuario no los haya tocado.
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.createdProduct.set(null);

    // El formulario es válido: "price" ya no es null.
    const input = this.form.getRawValue() as ProductInput;

    this.productService
      .create(input)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (product) => {
          this.createdProduct.set(product);
          this.form.reset();
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  /** Coloca los errores 422 de la API debajo de cada campo. */
  private handleError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const { errors } = error.error as ValidationErrorResponse;

      for (const [field, messages] of Object.entries(errors)) {
        this.form.get(field)?.setErrors({ server: messages[0] });
      }

      this.errorMessage.set('Revisa los campos marcados.');
      return;
    }

    this.errorMessage.set('No se pudo guardar el producto. Intenta de nuevo.');
  }
}
