import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      // ApiStatusComponent reemplaza por uno simulado.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the system name', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Examen TAP Terminal');
  });

  it('should link to the product list in the menu', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('.app-nav a');
    expect(link?.textContent?.trim()).toBe('Productos');
    expect(link?.getAttribute('href')).toBe('/productos');
  });
});
