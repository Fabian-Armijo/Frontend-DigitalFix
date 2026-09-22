import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { CatalogService, TechnicalService, SparePart } from '../../../services/catalog.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss']
})
export class Catalog implements OnInit {
  private catalogService = inject(CatalogService);
  private msalService = inject(MsalService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = '';
  services: TechnicalService[] = [];
  spareParts: SparePart[] = [];

  // Modelos para formulario de nuevo registro
  newService: TechnicalService = { name: '', fee: 0, description: '' };
  newPart: SparePart = { name: '', cost: 0, stock: 0 };

  // Control de edición en fila
  editingService: TechnicalService | null = null;
  editingPart: SparePart | null = null;

  // Control del modal de confirmación de eliminación
  itemToDelete: { id: number; name: string; type: 'service' | 'part' } | null = null;

  activeTab: 'services' | 'parts' = 'services';
  mensajeExito: string = '';

  ngOnInit(): void {
    this.obtenerCuentaYRol();
    this.cargarDatos();
  }

  get esAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  mostrarMensaje(texto: string): void {
    this.mensajeExito = texto;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeExito = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  private obtenerCuentaYRol(): void {
    let account = this.msalService.instance.getActiveAccount();
    if (!account) {
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        this.msalService.instance.setActiveAccount(account);
      }
    }

    if (account) {
      this.msalService.acquireTokenSilent({
        scopes: ['api://e0877608-03e1-4d4b-a0c9-d50d0ddbdb7c/access_as_user'],
        account: account
      }).subscribe({
        next: (response) => {
          try {
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            this.userRole = (payload.roles && payload.roles.length > 0) 
              ? payload.roles[0].toUpperCase() 
              : 'ADMIN';
          } catch {
            this.userRole = 'ADMIN';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.userRole = 'ADMIN';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.userRole = 'ADMIN';
      this.cdr.detectChanges();
    }
  }

  cargarDatos(): void {
    this.catalogService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar servicios:', err)
    });

    this.catalogService.getSpareParts().subscribe({
      next: (data) => {
        this.spareParts = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar repuestos:', err)
    });
  }

  // ==========================================
  // SERVICIOS TÉCNICOS
  // ==========================================

  guardarServicio(): void {
    if (!this.newService.name || this.newService.fee <= 0) return;

    this.catalogService.createService(this.newService).subscribe({
      next: (creado) => {
        this.services = [...this.services, creado];
        this.newService = { name: '', fee: 0, description: '' };
        this.mostrarMensaje('✅ Servicio registrado con éxito');
      },
      error: (err) => alert(`Error al crear: ${err.status}`)
    });
  }

  iniciarEdicionServicio(s: TechnicalService): void {
    this.editingService = { ...s };
    this.cdr.detectChanges();
  }

  guardarEdicionServicio(): void {
    if (!this.editingService || !this.editingService.id) return;

    this.catalogService.updateService(this.editingService.id, this.editingService).subscribe({
      next: (actualizado) => {
        this.services = this.services.map(s => s.id === actualizado.id ? actualizado : s);
        this.editingService = null;
        this.mostrarMensaje('✏️ Servicio actualizado con éxito');
      },
      error: (err) => alert(`Error al actualizar: ${err.status}`)
    });
  }

  cancelarEdicionServicio(): void {
    this.editingService = null;
    this.cdr.detectChanges();
  }

  solicitarEliminarServicio(s: TechnicalService): void {
    this.itemToDelete = { id: s.id!, name: s.name, type: 'service' };
    this.cdr.detectChanges();
  }

  // ==========================================
  // REPUESTOS
  // ==========================================

  guardarRepuesto(): void {
    if (!this.newPart.name || this.newPart.cost <= 0) return;

    this.catalogService.createSparePart(this.newPart).subscribe({
      next: (creado) => {
        this.spareParts = [...this.spareParts, creado];
        this.newPart = { name: '', cost: 0, stock: 0 };
        this.mostrarMensaje('✅ Repuesto registrado con éxito');
      },
      error: (err) => alert(`Error al crear: ${err.status}`)
    });
  }

  iniciarEdicionRepuesto(p: SparePart): void {
    this.editingPart = { ...p };
    this.cdr.detectChanges();
  }

  guardarEdicionRepuesto(): void {
    if (!this.editingPart || !this.editingPart.id) return;

    this.catalogService.updateSparePart(this.editingPart.id, this.editingPart).subscribe({
      next: (actualizado) => {
        this.spareParts = this.spareParts.map(p => p.id === actualizado.id ? actualizado : p);
        this.editingPart = null;
        this.mostrarMensaje('✏️ Repuesto actualizado con éxito');
      },
      error: (err) => alert(`Error al actualizar: ${err.status}`)
    });
  }

  cancelarEdicionRepuesto(): void {
    this.editingPart = null;
    this.cdr.detectChanges();
  }

  solicitarEliminarRepuesto(p: SparePart): void {
    this.itemToDelete = { id: p.id!, name: p.name, type: 'part' };
    this.cdr.detectChanges();
  }

  // ==========================================
  // MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
  // ==========================================

  cancelarEliminacion(): void {
    this.itemToDelete = null;
    this.cdr.detectChanges();
  }

  confirmarEliminacion(): void {
    if (!this.itemToDelete) return;

    const { id, type } = this.itemToDelete;

    if (type === 'service') {
      this.catalogService.deleteService(id).subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== id);
          this.mostrarMensaje('🗑️ Servicio eliminado correctamente');
          this.itemToDelete = null;
          this.cdr.detectChanges();
        },
        error: (err) => alert(`Error al eliminar: ${err.status}`)
      });
    } else {
      this.catalogService.deleteSparePart(id).subscribe({
        next: () => {
          this.spareParts = this.spareParts.filter(p => p.id !== id);
          this.mostrarMensaje('🗑️ Repuesto eliminado correctamente');
          this.itemToDelete = null;
          this.cdr.detectChanges();
        },
        error: (err) => alert(`Error al eliminar: ${err.status}`)
      });
    }
  }
}