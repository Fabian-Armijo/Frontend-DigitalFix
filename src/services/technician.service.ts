import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type TechnicianStatus = 'DISPONIBLE' | 'OCUPADO' | 'INACTIVO';

export interface Technician {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  status: TechnicianStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TechnicianRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  status?: TechnicianStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.api.bffUrl}/technicians`;

  // Obtener todos los técnicos (o filtrados por estado si se especifica)
  getTechnicians(status?: TechnicianStatus): Observable<Technician[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Technician[]>(this.baseUrl, { params });
  }

  // Obtener solo técnicos con estado DISPONIBLE
  getAvailableTechnicians(): Observable<Technician[]> {
    return this.http.get<Technician[]>(`${this.baseUrl}/available`);
  }

  // Obtener un técnico por ID
  getTechnicianById(id: number): Observable<Technician> {
    return this.http.get<Technician>(`${this.baseUrl}/${id}`);
  }

  // Crear un nuevo técnico (Admin o Supervisor)
  createTechnician(dto: TechnicianRequestDTO): Observable<Technician> {
    return this.http.post<Technician>(this.baseUrl, dto);
  }

  // Actualizar datos de un técnico existente
  updateTechnician(id: number, dto: TechnicianRequestDTO): Observable<Technician> {
    return this.http.put<Technician>(`${this.baseUrl}/${id}`, dto);
  }

  // Cambiar únicamente el estado del técnico (DISPONIBLE, OCUPADO, INACTIVO)
  updateStatus(id: number, status: TechnicianStatus): Observable<Technician> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Technician>(`${this.baseUrl}/${id}/status`, {}, { params });
  }

  // Eliminar un técnico
  deleteTechnician(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
