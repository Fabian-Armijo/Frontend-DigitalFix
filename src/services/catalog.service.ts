import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Modelos basados exactamente en tus DTOs y Entidades de Spring Boot
export interface TechnicalService {
  id?: number;
  name: string;
  fee: number;
  description?: string;
}

export interface SparePart {
  id?: number;
  name: string;
  cost: number;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  // URL base apuntando al BFF (puerto 8083)
  private baseUrl = 'http://localhost:8083/api/catalog';

  // --- SERVICIOS TÉCNICOS ---
  getServices(): Observable<TechnicalService[]> {
    return this.http.get<TechnicalService[]>(`${this.baseUrl}/services`);
  }

  createService(service: TechnicalService): Observable<TechnicalService> {
    return this.http.post<TechnicalService>(`${this.baseUrl}/services`, service);
  }

  // --- REPUESTOS ---
  getSpareParts(): Observable<SparePart[]> {
    return this.http.get<SparePart[]>(`${this.baseUrl}/spare-parts`);
  }

  createSparePart(part: SparePart): Observable<SparePart> {
    return this.http.post<SparePart>(`${this.baseUrl}/spare-parts`, part);
  }
}