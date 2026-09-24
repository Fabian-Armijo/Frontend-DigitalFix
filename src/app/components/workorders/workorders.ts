import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkorderService, WorkOrder, WorkOrderStatus } from '../../../services/workorder.service';
import { CatalogService, TechnicalService } from '../../../services/catalog.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../environments/environment';
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
  private authService = inject(AuthService);
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

  generarCustomerId(username: string): number {
    if (!username) return 1;
    const lower = username.toLowerCase();
    
    // Si el correo es "cliente@" (el primer cliente sin número)
    if (lower.startsWith('cliente@')) {
      return 1;
    }
    
    // Si tiene número explícito en el nombre de usuario (ej: cliente1, cliente2, cliente10)
    const match = lower.split('@')[0].match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > 0) return num;
    }

    // Para cualquier otro correo (ej: pedro@..., juan@...), hash determinista
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = ((hash << 5) - hash) + lower.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 900) + 10;
  }

  obtenerRolUsuario(): void {
    const account = this.authService.getAccount();
    if (account) {
      this.userEmail = account.username;
      this.customerId = this.generarCustomerId(account.username);

      this.authService.getUserRole().subscribe({
        next: (role) => {
          this.userRole = role;
          this.revisarSeleccionOrden();
          this.cdr.detectChanges();
        },
        error: () => {
          this.userRole = 'CLIENTE';
          this.revisarSeleccionOrden();
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
        this.revisarSeleccionOrden();
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

  revisarSeleccionOrden(): void {
    const filtradas = this.ordenesFiltradas;
    if (filtradas.length > 0 && (!this.selectedOrder || !filtradas.some(o => o.id === this.selectedOrder?.id))) {
      this.selectedOrder = filtradas[0];
    } else if (filtradas.length === 0) {
      this.selectedOrder = null;
    }
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
        const numMostrar = this.getNumeroOrden(nuevaOrden);
        this.mostrarExito(`🎉 ¡Orden #${numMostrar} creada con éxito! Puedes seguir su avance aquí.`);
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

  // Obtiene el número correlativo para el cliente (#1, #2...) o el ID global para Supervisor/Admin
  getNumeroOrden(ord: WorkOrder | null): number {
    if (!ord) return 0;
    if (this.userRole !== 'CLIENTE') {
      return ord.id || 0;
    }
    // Para el cliente: lista de sus órdenes ordenadas cronológicamente (ID ascendente)
    const misOrdenes = this.workOrders
      .filter(o => o.customerId === this.customerId)
      .sort((a, b) => (a.id || 0) - (b.id || 0));

    const index = misOrdenes.findIndex(o => o.id === ord.id);
    return index !== -1 ? index + 1 : (ord.id || 0);
  }

  // --- HELPERS PARA UI Y STEPPER ---
  get ordenesFiltradas(): WorkOrder[] {
    let lista = this.workOrders;

    // Si el usuario es CLIENTE, solo ve sus propias órdenes de mantención
    if (this.userRole === 'CLIENTE') {
      lista = lista.filter(o => o.customerId === this.customerId);
    }

    if (this.filtroEstado === 'ACTIVAS') {
      return lista.filter(o => o.status !== 'CERRADA' && o.status !== 'CANCELADA');
    }
    if (this.filtroEstado === 'FINALIZADAS') {
      return lista.filter(o => o.status === 'CERRADA' || o.status === 'CANCELADA');
    }
    return lista;
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
