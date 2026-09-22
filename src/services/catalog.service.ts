import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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
  // Usa la URL del API Gateway de AWS definida en environment
  private baseUrl = `${environment.api.bffUrl}/catalog`;

  // --- SERVICIOS TÉCNICOS ---
  getServices(): Observable<TechnicalService[]> {
    return this.http.get<TechnicalService[]>(`${this.baseUrl}/services`);
  }

  createService(service: TechnicalService): Observable<TechnicalService> {
    return this.http.post<TechnicalService>(`${this.baseUrl}/services`, service);
  }

  updateService(id: number, service: TechnicalService): Observable<TechnicalService> {
    return this.http.put<TechnicalService>(`${this.baseUrl}/services/${id}`, service);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/services/${id}`);
  }

  // --- REPUESTOS ---
  getSpareParts(): Observable<SparePart[]> {
    return this.http.get<SparePart[]>(`${this.baseUrl}/spare-parts`);
  }

  createSparePart(part: SparePart): Observable<SparePart> {
    return this.http.post<SparePart>(`${this.baseUrl}/spare-parts`, part);
  }

  updateSparePart(id: number, part: SparePart): Observable<SparePart> {
    return this.http.put<SparePart>(`${this.baseUrl}/spare-parts/${id}`, part);
  }

  deleteSparePart(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/spare-parts/${id}`);
  }
}