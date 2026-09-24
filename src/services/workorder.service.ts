import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type WorkOrderStatus = 
  | 'CREADA'
  | 'ASIGNADA'
  | 'EN_DESPLAZAMIENTO'
  | 'EN_EJECUCION'
  | 'CERRADA'
  | 'CANCELADA';

export interface WorkOrder {
  id?: number;
  customerId: number;
  technicianId?: number | null;
  description: string;
  status: WorkOrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrderRequestDTO {
  customerId: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkorderService {
  private http = inject(HttpClient);
  // Usa la URL del API Gateway de AWS definida en environment
  private baseUrl = `${environment.api.bffUrl}/workorders`;

  // Obtener todas las órdenes
  getWorkOrders(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(this.baseUrl);
  }

  // Obtener orden por ID
  getWorkOrderById(id: number): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.baseUrl}/${id}`);
  }

  // Crear nueva orden (Actor: Cliente o Supervisor)
  createWorkOrder(dto: WorkOrderRequestDTO): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.baseUrl, dto);
  }

  // Asignar técnico (Actor: Supervisor)
  assignTechnician(orderId: number, technicianId: number): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${this.baseUrl}/${orderId}/assign/${technicianId}`, {});
  }

  // Cambiar estado (Actor: Supervisor / Técnico)
  updateStatus(orderId: number, newStatus: WorkOrderStatus): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${this.baseUrl}/${orderId}/status?newStatus=${newStatus}`, {});
  }

  // Eliminar orden
  deleteWorkOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
