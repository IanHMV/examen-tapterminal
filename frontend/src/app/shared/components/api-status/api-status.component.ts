import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Healthcheck } from '../../../core/models/healthcheck.model';
import { HealthcheckService } from '../../../core/services/healthcheck.service';

type ApiState = 'loading' | 'online' | 'offline';

/**
 * Muestra si la API está disponible y permite volver a verificarlo.
 */
@Component({
  selector: 'app-api-status',
  imports: [DatePipe],
  templateUrl: './api-status.component.html',
  styleUrl: './api-status.component.scss',
})
export class ApiStatusComponent implements OnInit {
  private readonly healthcheckService = inject(HealthcheckService);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<ApiState>('loading');
  protected readonly healthcheck = signal<Healthcheck | null>(null);

  ngOnInit(): void {
    this.check();
  }

  protected check(): void {
    this.state.set('loading');

    this.healthcheckService.check().subscribe({
      next: (response) => {
        this.healthcheck.set(response);
        this.state.set('online');
      },
      error: () => {
        this.healthcheck.set(null);
        this.state.set('offline');
      },
    });
  }
}
