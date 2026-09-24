import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';
import { WorkorderService, WorkOrder, WorkOrderStatus, WorkOrderRequestDTO } from '../../../services/workorder.service';
import { TechnicianService, Technician, TechnicianStatus, TechnicianRequestDTO } from '../../../services/technician.service';
import { CatalogService, TechnicalService, SparePart } from '../../../services/catalog.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private msalService = inject(MsalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private workorderService = inject(WorkorderService);
  private technicianService = inject(TechnicianService);
  private catalogService = inject(CatalogService);

  // Rol y Usuario
  userRole: string = '';
  userName: string = '';

  // Pestañas del Dashboard ('workorders' | 'technicians' | 'kpis')
  activeTab: 'workorders' | 'technicians' | 'kpis' = 'workorders';

  // Datos del Negocio
  workOrders: WorkOrder[] = [];
  technicians: Technician[] = [];
  spareParts: SparePart[] = [];
  services: TechnicalService[] = [];

  // Estados de carga y mensajes
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Filtros de listas
  filtroOrden: 'TODAS' | 'CREADA' | 'EN_CURSO' | 'FINALIZADAS' = 'TODAS';
  filtroTecnico: 'TODOS' | 'DISPONIBLE' | 'OCUPADO' | 'INACTIVO' = 'TODOS';

  // Modal Aceptar / Asignar Técnico
  orderToAssign: WorkOrder | null = null;
  selectedTechIdToAssign: number | null = null;
  selectedPartIdToAssign: number | null = null;
  guardandoAsignacion: boolean = false;

  // Modal Cambiar Estado de Orden
  orderToChangeStatus: WorkOrder | null = null;
  selectedNewStatus: WorkOrderStatus = 'ASIGNADA';
  guardandoCambioEstado: boolean = false;

  // Modal Editar Orden de Trabajo (CRUD Supervisor)
  orderToEdit: WorkOrder | null = null;
  editOrderDescription: string = '';
  editOrderCustomerId: number = 1;
  editOrderSelectedTechId: number | null = null;
  guardandoEdicionOrden: boolean = false;

  // Modal Detalle / Stepper de Orden
  orderDetail: WorkOrder | null = null;

  // Modal Eliminar / Cancelar Orden
  orderToDelete: WorkOrder | null = null;

  // Modal Crear / Editar Técnico (CRUD)
  showTechModal: boolean = false;
  isEditingTech: boolean = false;
  editingTechId: number | null = null;
  techForm: TechnicianRequestDTO = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    status: 'DISPONIBLE'
  };
  guardandoTecnico: boolean = false;

  // Modal Eliminar Técnico
  techToDelete: Technician | null = null;

  // Fases del Ciclo de Vida de la Orden (Caso 6 DigitalFix)
  readonly fases = [
    { paso: 1, key: 'CREADA', titulo: 'Solicitud Registrada', desc: 'Esperando aceptación y asignación', icon: '📝' },
    { paso: 2, key: 'ASIGNADA', titulo: 'Técnico Asignado', desc: 'Especialista asignado al trabajo', icon: '👨‍🔧' },
    { paso: 3, key: 'EN_DESPLAZAMIENTO', titulo: 'Técnico en Camino', desc: 'En ruta al domicilio/oficina', icon: '🛵' },
    { paso: 4, key: 'EN_EJECUCION', titulo: 'En Mantención', desc: 'Reparación/mantención en curso', icon: '⚙️' },
    { paso: 5, key: 'CERRADA', titulo: 'Finalizada', desc: 'Mantención completada con éxito', icon: '✅' }
  ];

  ngOnInit(): void {
    this.verificarSesionYRol();
  }

  // ==========================================
  // AUTENTICACIÓN Y ROLES
  // ==========================================
  verificarSesionYRol(): void {
    const account = this.authService.getAccount();
    if (!account) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = account.name || account.username;

    this.authService.getUserRole().subscribe({
      next: (role) => {
        this.userRole = role;
        console.log('📌 [DashboardComponent] Usuario:', this.userName, '| Rol resuelto:', this.userRole);
        this.procesarAccesoSegunRol();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al resolver rol en dashboard:', err);
        this.userRole = 'CLIENTE';
        this.procesarAccesoSegunRol();
        this.cdr.detectChanges();
      }
    });
  }

  private procesarAccesoSegunRol(): void {
    // Si es CLIENTE, redirigir a su vista especializada de seguimiento de órdenes
    if (this.userRole === 'CLIENTE') {
      this.router.navigate(['/workorders']);
      return;
    }

    // Para SUPERVISOR y ADMIN, nos mantenemos en el Dashboard
    if (this.userRole === 'SUPERVISOR') {
      this.activeTab = 'workorders';
    } else if (this.userRole === 'ADMIN') {
      this.activeTab = 'kpis';
    }

    this.cargarTodosLosDatos();
  }

  // ==========================================
  // CARGA DE DATOS DESDE APIS
  // ==========================================
  cargarTodosLosDatos(): void {
    this.cargando = true;
    this.cargarOrdenes();
    this.cargarTecnicos();
    this.cargarServiciosYRepuestos();
  }

  cargarOrdenes(): void {
    this.workorderService.getWorkOrders().subscribe({
      next: (data) => {
        this.workOrders = data.sort((a, b) => (b.id || 0) - (a.id || 0));
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

  cargarTecnicos(): void {
    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        this.technicians = data.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar técnicos:', err)
    });
  }

  cargarServiciosYRepuestos(): void {
    this.catalogService.getServices().subscribe({
      next: (data) => this.services = data,
      error: (err) => console.error('Error al cargar servicios:', err)
    });

    this.catalogService.getSpareParts().subscribe({
      next: (data) => this.spareParts = data,
      error: (err) => console.error('Error al cargar repuestos:', err)
    });
  }

  // ==========================================
  // KPIS CALCULADOS
  // ==========================================
  get totalOrdenesPendientes(): number {
    return this.workOrders.filter(o => o.status === 'CREADA').length;
  }

  get totalOrdenesEnCurso(): number {
    return this.workOrders.filter(o => 
      o.status === 'ASIGNADA' || o.status === 'EN_DESPLAZAMIENTO' || o.status === 'EN_EJECUCION'
    ).length;
  }

  get totalOrdenesCerradas(): number {
    return this.workOrders.filter(o => o.status === 'CERRADA').length;
  }

  get totalTecnicosDisponibles(): number {
    return this.technicians.filter(t => t.status === 'DISPONIBLE').length;
  }

  get totalTecnicosOcupados(): number {
    return this.technicians.filter(t => t.status === 'OCUPADO').length;
  }

  get stockCriticoCount(): number {
    return this.spareParts.filter(p => p.stock <= 3).length;
  }

  // ==========================================
  // FILTRADO DE DATOS
  // ==========================================
  get ordenesFiltradas(): WorkOrder[] {
    switch (this.filtroOrden) {
      case 'CREADA':
        return this.workOrders.filter(o => o.status === 'CREADA');
      case 'EN_CURSO':
        return this.workOrders.filter(o => 
          o.status === 'ASIGNADA' || o.status === 'EN_DESPLAZAMIENTO' || o.status === 'EN_EJECUCION'
        );
      case 'FINALIZADAS':
        return this.workOrders.filter(o => o.status === 'CERRADA' || o.status === 'CANCELADA');
      default:
        return this.workOrders;
    }
  }

  get tecnicosFiltrados(): Technician[] {
    if (this.filtroTecnico === 'TODOS') return this.technicians;
    return this.technicians.filter(t => t.status === this.filtroTecnico);
  }

  get tecnicosDisponibles(): Technician[] {
    return this.technicians.filter(t => t.status === 'DISPONIBLE');
  }

  getNombreTecnico(techId?: number | null): string {
    if (!techId) return 'Sin Asignar';
    const tech = this.technicians.find(t => t.id === techId);
    return tech ? `${tech.firstName} ${tech.lastName} (${tech.specialty})` : `Técnico #${techId}`;
  }

  // ==========================================
  // ACCIONES SUPERVISOR: ACEPTAR Y ASIGNAR TÉCNICO
  // ==========================================
  abrirModalAsignar(ord: WorkOrder): void {
    this.orderToAssign = ord;
    const disponibles = this.tecnicosDisponibles;
    this.selectedTechIdToAssign = disponibles.length > 0 ? disponibles[0].id! : (this.technicians[0]?.id || null);
    this.selectedPartIdToAssign = null;
    this.cdr.detectChanges();
  }

  cerrarModalAsignar(): void {
    this.orderToAssign = null;
    this.selectedTechIdToAssign = null;
    this.selectedPartIdToAssign = null;
    this.cdr.detectChanges();
  }

  confirmarAsignacion(): void {
    if (!this.orderToAssign || !this.orderToAssign.id || !this.selectedTechIdToAssign) {
      this.mostrarError('Debes seleccionar un técnico para asignar.');
      return;
    }

    this.guardandoAsignacion = true;
    const orderId = this.orderToAssign.id;
    const techId = this.selectedTechIdToAssign;
    const partId = this.selectedPartIdToAssign;

    // 1. Asignar técnico en WorkOrders (Pasa a ASIGNADA)
    this.workorderService.assignTechnician(orderId, techId).subscribe({
      next: (ordenActualizada) => {
        // Actualizar en el array local
        this.workOrders = this.workOrders.map(o => o.id === orderId ? ordenActualizada : o);

        // 2. Actualizar estado del técnico a OCUPADO en microservicio de técnicos
        this.technicianService.updateStatus(techId, 'OCUPADO').subscribe({
          next: (techActualizado) => {
            this.technicians = this.technicians.map(t => t.id === techId ? techActualizado : t);
            this.cdr.detectChanges();
          },
          error: (err) => console.warn('Aviso: No se pudo cambiar estado del técnico en ms-technicians:', err)
        });

        // 3. Si se seleccionó repuesto del catálogo: Regla del Caso 6 ("El stock disminuye al asignar la orden")
        if (partId) {
          this.catalogService.reduceStock(partId, 1).subscribe({
            next: (partActualizada) => {
              this.spareParts = this.spareParts.map(p => p.id === partId ? partActualizada : p);
              this.mostrarExito(`🎉 ¡Orden #${orderId} aceptada y asignada! Se descontó 1 unidad de "${partActualizada.name}".`);
            },
            error: () => {
              this.mostrarExito(`🎉 ¡Orden #${orderId} aceptada y asignada con éxito al técnico!`);
            }
          });
        } else {
          this.mostrarExito(`🎉 ¡Orden #${orderId} aceptada y asignada con éxito!`);
        }

        this.guardandoAsignacion = false;
        this.cerrarModalAsignar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al asignar orden:', err);
        this.guardandoAsignacion = false;
        this.mostrarError(`Error al asignar técnico (Status: ${err.status}): ${err.error?.message || 'Verifica los permisos'}`);
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // ACCIONES SUPERVISOR: CAMBIAR ESTADO DE LA ORDEN
  // ==========================================
  abrirModalEstadoOrden(ord: WorkOrder): void {
    this.orderToChangeStatus = ord;
    // Sugerir siguiente estado lógico
    switch (ord.status) {
      case 'CREADA':
        this.selectedNewStatus = 'ASIGNADA';
        break;
      case 'ASIGNADA':
        this.selectedNewStatus = 'EN_DESPLAZAMIENTO';
        break;
      case 'EN_DESPLAZAMIENTO':
        this.selectedNewStatus = 'EN_EJECUCION';
        break;
      case 'EN_EJECUCION':
        this.selectedNewStatus = 'CERRADA';
        break;
      default:
        this.selectedNewStatus = 'CERRADA';
        break;
    }
    this.cdr.detectChanges();
  }

  cerrarModalEstadoOrden(): void {
    this.orderToChangeStatus = null;
    this.cdr.detectChanges();
  }

  confirmarCambioEstadoOrden(): void {
    if (!this.orderToChangeStatus || !this.orderToChangeStatus.id) return;

    const ord = this.orderToChangeStatus;
    const orderId = ord.id!;
    const newStatus = this.selectedNewStatus;

    // Regla de Negocio Caso 6: No se puede pasar a EN_EJECUCIÓN sin ASIGNAR
    if (newStatus === 'EN_EJECUCION' && (!ord.technicianId || ord.status === 'CREADA')) {
      this.mostrarError('⚠️ Regla de negocio: No se puede pasar a EN_EJECUCIÓN sin haber ASIGNADO un técnico previamente.');
      return;
    }

    this.guardandoCambioEstado = true;
    this.workorderService.updateStatus(orderId, newStatus).subscribe({
      next: (actualizada) => {
        this.workOrders = this.workOrders.map(o => o.id === orderId ? actualizada : o);

        // Si se cierra o cancela la orden, liberar al técnico (volverlo a DISPONIBLE)
        if ((newStatus === 'CERRADA' || newStatus === 'CANCELADA') && ord.technicianId) {
          this.technicianService.updateStatus(ord.technicianId, 'DISPONIBLE').subscribe({
            next: (techLibre) => {
              this.technicians = this.technicians.map(t => t.id === techLibre.id ? techLibre : t);
              this.cdr.detectChanges();
            },
            error: (err) => console.warn('No se pudo liberar técnico:', err)
          });
        }

        this.mostrarExito(`🔄 Estado de la orden #${orderId} actualizado a "${this.getStatusLabel(newStatus)}".`);
        this.guardandoCambioEstado = false;
        this.cerrarModalEstadoOrden();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.guardandoCambioEstado = false;
        const msg = err.error?.message || err.statusText || 'Error al cambiar estado';
        this.mostrarError(`No se pudo cambiar el estado: ${msg}`);
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // OPERACIONES SUPERVISOR: EDITAR, CERRAR Y CANCELAR
  // ==========================================
  abrirModalEditarOrden(ord: WorkOrder): void {
    this.orderToEdit = ord;
    this.editOrderDescription = ord.description;
    this.editOrderCustomerId = ord.customerId;
    this.editOrderSelectedTechId = ord.technicianId || null;
    this.cdr.detectChanges();
  }

  cerrarModalEditarOrden(): void {
    this.orderToEdit = null;
    this.cdr.detectChanges();
  }

  confirmarEdicionOrden(): void {
    if (!this.orderToEdit || !this.orderToEdit.id) return;
    if (!this.editOrderDescription.trim()) {
      this.mostrarError('La descripción del requerimiento no puede estar vacía.');
      return;
    }

    const orderId = this.orderToEdit.id;
    this.guardandoEdicionOrden = true;

    this.workorderService.updateWorkOrder(orderId, {
      customerId: this.editOrderCustomerId,
      description: this.editOrderDescription.trim()
    }).subscribe({
      next: (actualizada) => {
        // Si además el Supervisor cambió o asignó un técnico durante la edición:
        if (this.editOrderSelectedTechId && this.editOrderSelectedTechId !== this.orderToEdit?.technicianId) {
          const nuevoTechId = this.editOrderSelectedTechId;
          this.workorderService.assignTechnician(orderId, nuevoTechId).subscribe({
            next: (ordenReasignada) => {
              this.workOrders = this.workOrders.map(o => o.id === orderId ? ordenReasignada : o);
              this.technicianService.updateStatus(nuevoTechId, 'OCUPADO').subscribe({
                next: (t) => {
                  this.technicians = this.technicians.map(tech => tech.id === t.id ? t : tech);
                  this.cdr.detectChanges();
                }
              });
              this.guardandoEdicionOrden = false;
              this.cerrarModalEditarOrden();
              this.mostrarExito(`✏️ ¡Orden #${orderId} actualizada y técnico asignado!`);
              this.cdr.detectChanges();
            },
            error: () => {
              this.workOrders = this.workOrders.map(o => o.id === orderId ? actualizada : o);
              this.guardandoEdicionOrden = false;
              this.cerrarModalEditarOrden();
              this.mostrarExito(`✏️ Orden #${orderId} actualizada.`);
              this.cdr.detectChanges();
            }
          });
        } else {
          this.workOrders = this.workOrders.map(o => o.id === orderId ? actualizada : o);
          this.guardandoEdicionOrden = false;
          this.cerrarModalEditarOrden();
          this.mostrarExito(`✏️ Orden #${orderId} actualizada correctamente.`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al actualizar orden:', err);
        this.guardandoEdicionOrden = false;
        this.mostrarError(`No se pudo actualizar la orden (Status: ${err.status})`);
        this.cdr.detectChanges();
      }
    });
  }

  // Cierre directo de trabajo por el Supervisor (Regla Caso 6)
  cerrarTrabajoDirecto(ord: WorkOrder): void {
    if (!ord || !ord.id) return;
    const orderId = ord.id;

    if (ord.status === 'CREADA' && !ord.technicianId) {
      this.mostrarError('⚠️ La orden aún está CREADA y sin técnico asignado. Primero debes aceptarla y asignarle un técnico.');
      return;
    }

    this.workorderService.updateStatus(orderId, 'CERRADA').subscribe({
      next: (actualizada) => {
        this.workOrders = this.workOrders.map(o => o.id === orderId ? actualizada : o);
        // Liberar al técnico asignado volviéndolo a DISPONIBLE en la base de datos
        if (ord.technicianId) {
          this.technicianService.updateStatus(ord.technicianId, 'DISPONIBLE').subscribe({
            next: (techLibre) => {
              this.technicians = this.technicians.map(t => t.id === techLibre.id ? techLibre : t);
              this.cdr.detectChanges();
            }
          });
        }
        this.mostrarExito(`✅ ¡Trabajo #${orderId} cerrado con éxito! El técnico especialista fue liberado a "DISPONIBLE".`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError(`Error al cerrar orden: ${err.error?.message || err.status}`);
        this.cdr.detectChanges();
      }
    });
  }

  // Cancelación directa por el Supervisor
  cancelarOrdenDirecto(ord: WorkOrder): void {
    if (!ord || !ord.id) return;
    const orderId = ord.id;

    this.workorderService.updateStatus(orderId, 'CANCELADA').subscribe({
      next: (actualizada) => {
        this.workOrders = this.workOrders.map(o => o.id === orderId ? actualizada : o);
        if (ord.technicianId) {
          this.technicianService.updateStatus(ord.technicianId, 'DISPONIBLE').subscribe({
            next: (techLibre) => {
              this.technicians = this.technicians.map(t => t.id === techLibre.id ? techLibre : t);
              this.cdr.detectChanges();
            }
          });
        }
        this.mostrarExito(`❌ Orden #${orderId} marcada como CANCELADA.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError(`Error al cancelar orden: ${err.error?.message || err.status}`);
        this.cdr.detectChanges();
      }
    });
  }

  solicitarEliminarOrden(ord: WorkOrder): void {
    this.orderToDelete = ord;
    this.cdr.detectChanges();
  }

  cancelarEliminarOrden(): void {
    this.orderToDelete = null;
    this.cdr.detectChanges();
  }

  confirmarEliminarOrden(): void {
    if (!this.orderToDelete || !this.orderToDelete.id) return;
    const id = this.orderToDelete.id;

    this.workorderService.deleteWorkOrder(id).subscribe({
      next: () => {
        this.workOrders = this.workOrders.filter(o => o.id !== id);
        this.orderToDelete = null;
        this.mostrarExito(`🗑️ Orden #${id} eliminada correctamente.`);
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: Si el backend aún no expone DELETE, cancelamos la orden
        this.workorderService.updateStatus(id, 'CANCELADA').subscribe({
          next: (cancelada) => {
            this.workOrders = this.workOrders.map(o => o.id === id ? cancelada : o);
            this.orderToDelete = null;
            this.mostrarExito(`Orden #${id} marcada como CANCELADA.`);
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.mostrarError(`Error al procesar eliminación/cancelación: ${err.status}`);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // ==========================================
  // DETALLE Y STEPPER DE LA ORDEN
  // ==========================================
  verDetalleOrden(ord: WorkOrder): void {
    this.orderDetail = ord;
    this.cdr.detectChanges();
  }

  cerrarDetalleOrden(): void {
    this.orderDetail = null;
    this.cdr.detectChanges();
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
      case 'EN_EJECUCION': return 'En Mantención';
      case 'CERRADA': return 'Finalizada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }

  // ==========================================
  // CRUD TÉCNICOS: CREAR, EDITAR, ESTADO, ELIMINAR
  // ==========================================
  cambiarEstadoTecnico(tech: Technician, nuevoEstado: TechnicianStatus): void {
    if (!tech.id || tech.status === nuevoEstado) return;

    this.technicianService.updateStatus(tech.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.technicians = this.technicians.map(t => t.id === tech.id ? actualizado : t);
        this.mostrarExito(`🟢 Técnico ${tech.firstName} ${tech.lastName} ahora está "${nuevoEstado}".`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar estado del técnico:', err);
        this.mostrarError(`Error al cambiar estado del técnico: ${err.status}`);
        this.cdr.detectChanges();
      }
    });
  }

  abrirCrearTecnico(): void {
    this.isEditingTech = false;
    this.editingTechId = null;
    this.techForm = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      status: 'DISPONIBLE'
    };
    this.showTechModal = true;
    this.cdr.detectChanges();
  }

  abrirEditarTecnico(tech: Technician): void {
    this.isEditingTech = true;
    this.editingTechId = tech.id!;
    this.techForm = {
      firstName: tech.firstName,
      lastName: tech.lastName,
      email: tech.email,
      phone: tech.phone || '',
      specialty: tech.specialty,
      status: tech.status
    };
    this.showTechModal = true;
    this.cdr.detectChanges();
  }

  cerrarTechModal(): void {
    this.showTechModal = false;
    this.cdr.detectChanges();
  }

  guardarTecnico(): void {
    if (!this.techForm.firstName.trim() || !this.techForm.lastName.trim() || !this.techForm.email.trim() || !this.techForm.specialty.trim()) {
      this.mostrarError('Por favor completa los campos obligatorios: Nombre, Apellido, Email y Especialidad.');
      return;
    }

    this.guardandoTecnico = true;

    if (this.isEditingTech && this.editingTechId) {
      this.technicianService.updateTechnician(this.editingTechId, this.techForm).subscribe({
        next: (actualizado) => {
          this.technicians = this.technicians.map(t => t.id === this.editingTechId ? actualizado : t);
          this.guardandoTecnico = false;
          this.cerrarTechModal();
          this.mostrarExito(`✏️ Técnico ${actualizado.firstName} ${actualizado.lastName} actualizado con éxito.`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar técnico:', err);
          this.guardandoTecnico = false;
          this.mostrarError(`Error al actualizar técnico (Status: ${err.status}): ${err.error?.message || 'Verifica permisos'}`);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.technicianService.createTechnician(this.techForm).subscribe({
        next: (creado) => {
          this.technicians = [...this.technicians, creado];
          this.guardandoTecnico = false;
          this.cerrarTechModal();
          this.mostrarExito(`🎉 Técnico ${creado.firstName} ${creado.lastName} registrado con éxito.`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al crear técnico:', err);
          this.guardandoTecnico = false;
          this.mostrarError(`Error al crear técnico (Status: ${err.status}): ${err.error?.message || 'Verifica permisos'}`);
          this.cdr.detectChanges();
        }
      });
    }
  }

  solicitarEliminarTecnico(tech: Technician): void {
    this.techToDelete = tech;
    this.cdr.detectChanges();
  }

  cancelarEliminarTecnico(): void {
    this.techToDelete = null;
    this.cdr.detectChanges();
  }

  confirmarEliminarTecnico(): void {
    if (!this.techToDelete || !this.techToDelete.id) return;
    const id = this.techToDelete.id;

    this.technicianService.deleteTechnician(id).subscribe({
      next: () => {
        this.technicians = this.technicians.filter(t => t.id !== id);
        this.mostrarExito(`🗑️ Técnico eliminado correctamente.`);
        this.techToDelete = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar técnico:', err);
        this.mostrarError(`Error al eliminar técnico (Status: ${err.status}): ${err.error?.message || 'Verifica permisos'}`);
        this.cdr.detectChanges();
      }
    });
  }

  getTechStatusBadgeClass(status: TechnicianStatus): string {
    switch (status) {
      case 'DISPONIBLE': return 'badge-tech-available';
      case 'OCUPADO': return 'badge-tech-busy';
      case 'INACTIVO': return 'badge-tech-inactive';
      default: return '';
    }
  }

  // ==========================================
  // HELPERS DE NOTIFICACIÓN
  // ==========================================
  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeExito = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  mostrarError(msg: string): void {
    this.mensajeError = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeError = '';
      this.cdr.detectChanges();
    }, 5500);
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}