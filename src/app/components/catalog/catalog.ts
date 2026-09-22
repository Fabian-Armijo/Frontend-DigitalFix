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
  private cdr = inject(ChangeDetectorRef); // Para forzar el refresco visual inmediato

  userRole: string = '';
  services: TechnicalService[] = [];
  spareParts: SparePart[] = [];

  newService: TechnicalService = { name: '', fee: 0, description: '' };
  newPart: SparePart = { name: '', cost: 0, stock: 0 };

  activeTab: 'services' | 'parts' = 'services';

  ngOnInit(): void {
    this.obtenerCuentaYRol();
    this.cargarDatos();
  }

  get esAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  // 1. Obtiene la cuenta de inmediato incluso al hacer F5
  private obtenerCuentaYRol(): void {
    let account = this.msalService.instance.getActiveAccount();

    // Si al recargar F5 está null, tomamos la cuenta logueada de la memoria
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
            if (payload.roles && payload.roles.length > 0) {
              this.userRole = payload.roles[0].toUpperCase();
            } else {
              this.userRole = 'ADMIN';
            }
          } catch {
            this.userRole = 'ADMIN';
          }
          // Refrescamos la pantalla para mostrar "ADMIN" de inmediato
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
        this.cdr.detectChanges(); // Refresca la tabla al instante
      },
      error: (err) => console.error('Error al cargar servicios:', err)
    });

    this.catalogService.getSpareParts().subscribe({
      next: (data) => {
        this.spareParts = data;
        this.cdr.detectChanges(); // Refresca la tabla al instante
      },
      error: (err) => console.error('Error al cargar repuestos:', err)
    });
  }

  // POST: Crear Servicio
  guardarServicio(): void {
    if (!this.newService.name || this.newService.fee <= 0) {
      alert('Por favor ingresa un nombre y tarifa válida');
      return;
    }

    this.catalogService.createService(this.newService).subscribe({
      next: (creado) => {
        
        // Actualizamos la lista de manera inmutable
        this.services = [...this.services, creado];
        this.newService = { name: '', fee: 0, description: '' };
        // Forzamos el renderizado inmediato en pantalla sin recargar
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear servicio:', err);
        alert(`Error al crear: ${err.status}`);
      }
    });
  }

  // POST: Crear Repuesto
  guardarRepuesto(): void {
    if (!this.newPart.name || this.newPart.cost <= 0) {
      alert('Por favor ingresa un nombre y costo válido');
      return;
    }

    this.catalogService.createSparePart(this.newPart).subscribe({
      next: (creado) => {
        
        // Actualizamos la lista de manera inmutable
        this.spareParts = [...this.spareParts, creado];
        this.newPart = { name: '', cost: 0, stock: 0 };
        // Forzamos el renderizado inmediato en pantalla sin recargar
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear repuesto:', err);
        alert(`Error al crear: ${err.status}`);
      }
    });
  }
}