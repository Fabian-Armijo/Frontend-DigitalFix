import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkorderService, WorkOrder, WorkOrderStatus } from '../../../services/workorder.service';
import { CatalogService, TechnicalService } from '../../../services/catalog.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-workorders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workorders.html',
  styleUrl: './workorders.scss',
})
export class Workorders implements OnInit {
  private workorderService = inject(WorkorderService);
  private catalogService = inject(CatalogService);
  private msalService = inject(MsalService);
  private cdr = inject(ChangeDetectorRef);

  // Datos principales
  workOrders: WorkOrder[] = [];
  technicalServices: TechnicalService[] = [];
  selectedOrder: WorkOrder | null = null;

  // Estado del usuario y rol
  userRole: string = 'CLIENTE';
  userEmail: string = '';
  customerId: number = 1;

  // Formulario de nueva orden para el cliente
  selectedServiceId: number | null = null;
  orderDescription: string = '';
  orderNotes: string = '';

  // Filtros y estados de UI
  filtroEstado: string = 'TODAS'; // 'TODAS' | 'ACTIVAS' | 'FINALIZADAS'
  cargando: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Fases del ciclo de vida para el Stepper de Seguimiento
  readonly fases = [
    { paso: 1, key: 'CREADA', titulo: 'Solicitud Registrada', desc: 'Esperando asignación de técnico', icon: '📝' },
    { paso: 2, key: 'ASIGNADA', titulo: 'Técnico Asignado', desc: 'Especialista asignado al trabajo', icon: '👨‍🔧' },
    { paso: 3, key: 'EN_DESPLAZAMIENTO', titulo: 'Técnico en Camino', desc: 'En ruta al domicilio/oficina', icon: '🛵' },
    { paso: 4, key: 'EN_EJECUCION', titulo: 'En Mantención', desc: 'Reparación/mantención en curso', icon: '⚙️' },
    { paso: 5, key: 'CERRADA', titulo: 'Finalizada', desc: 'Mantención completada con éxito', icon: '✅' }
  ];

  ngOnInit(): void {
    this.obtenerRolUsuario();
    this.cargarOrdenes();
    this.cargarServiciosCatalogo();
  }

  obtenerRolUsuario(): void {
    const account = this.msalService.instance.getActiveAccount() || this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.userEmail = account.username;
      this.msalService.acquireTokenSilent({
        scopes: ['api://e0877608-03e1-4d4b-a0c9-d50d0ddbdb7c/access_as_user'],
        account: account
      }).subscribe({
        next: (response) => {
          try {
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            if (payload.roles && payload.roles.length > 0) {
              this.userRole = payload.roles[0].toUpperCase();
            } else {
              this.userRole = 'CLIENTE';
            }
          } catch {
            this.userRole = 'CLIENTE';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.userRole = 'CLIENTE';
          this.cdr.detectChanges();
        }
      });
    }
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.workorderService.getWorkOrders().subscribe({
      next: (data) => {
        // Ordenar de más reciente a más antigua
        this.workOrders = data.sort((a, b) => (b.id || 0) - (a.id || 0));
        // Si no hay orden seleccionada o la seleccionada ya no existe, seleccionar la primera
        if (this.workOrders.length > 0 && !this.selectedOrder) {
          this.selectedOrder = this.workOrders[0];
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar órdenes:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarServiciosCatalogo(): void {
    this.catalogService.getServices().subscribe({
      next: (data) => {
        this.technicalServices = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar catálogo de servicios:', err)
    });
  }

  onServiceChange(): void {
    if (this.selectedServiceId) {
      const s = this.technicalServices.find(item => item.id === Number(this.selectedServiceId));
      if (s) {
        this.orderDescription = `Mantención de equipo: ${s.name}`;
      }
    }
  }

  crearOrden(): void {
    if (!this.orderDescription.trim()) {
      this.mostrarError('Por favor describe el requerimiento o problema del equipo.');
      return;
    }

    let descripcionFinal = this.orderDescription.trim();
    if (this.orderNotes.trim()) {
      descripcionFinal += ` | Notas del cliente: ${this.orderNotes.trim()}`;
    }

    this.guardando = true;
    this.workorderService.createWorkOrder({
      customerId: this.customerId,
      description: descripcionFinal
    }).subscribe({
      next: (nuevaOrden) => {
        this.workOrders = [nuevaOrden, ...this.workOrders];
        this.selectedOrder = nuevaOrden;
        this.orderDescription = '';
        this.orderNotes = '';
        this.selectedServiceId = null;
        this.guardando = false;
        this.mostrarExito(`🎉 ¡Orden #${nuevaOrden.id} creada con éxito! Puedes seguir su avance aquí.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear orden:', err);
        this.guardando = false;
        this.mostrarError(`Error al registrar la orden (Status: ${err.status}). Verifica tus permisos.`);
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarOrden(orden: WorkOrder): void {
    this.selectedOrder = orden;
    this.cdr.detectChanges();
  }

  // --- HELPERS PARA UI Y STEPPER ---
  get ordenesFiltradas(): WorkOrder[] {
    if (this.filtroEstado === 'ACTIVAS') {
      return this.workOrders.filter(o => o.status !== 'CERRADA' && o.status !== 'CANCELADA');
    }
    if (this.filtroEstado === 'FINALIZADAS') {
      return this.workOrders.filter(o => o.status === 'CERRADA' || o.status === 'CANCELADA');
    }
    return this.workOrders;
  }

  getPasoActual(status: WorkOrderStatus): number {
    switch (status) {
      case 'CREADA': return 1;
      case 'ASIGNADA': return 2;
      case 'EN_DESPLAZAMIENTO': return 3;
      case 'EN_EJECUCION': return 4;
      case 'CERRADA': return 5;
      default: return 0;
    }
  }

  getStatusBadgeClass(status: WorkOrderStatus): string {
    return `badge-${status.toLowerCase()}`;
  }

  getStatusLabel(status: WorkOrderStatus): string {
    switch (status) {
      case 'CREADA': return 'Solicitud Registrada';
      case 'ASIGNADA': return 'Técnico Asignado';
      case 'EN_DESPLAZAMIENTO': return 'Técnico en Camino';
      case 'EN_EJECUCION': return 'Mantenimiento en Curso';
      case 'CERRADA': return 'Finalizada con Éxito';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }

  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    setTimeout(() => {
      this.mensajeExito = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  mostrarError(msg: string): void {
    this.mensajeError = msg;
    setTimeout(() => {
      this.mensajeError = '';
      this.cdr.detectChanges();
    }, 5000);
  }
}
