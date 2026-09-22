import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // 1. IMPORTANTE: Importar HttpClient
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = 'SUPERVISOR'; // Rol por defecto si no detecta uno

  // 2. Inyectamos HttpClient junto a MsalService
  constructor(
    private msalService: MsalService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.userName = account.username;

      // EXTRA: Leemos automáticamente los roles reales que asignaste en Azure
      const roles = (account.idTokenClaims as any)?.roles;
      if (roles && roles.length > 0) {
        this.userRole = roles[0]; // Toma 'ADMIN', 'SUPERVISOR', etc.
        console.log('Roles obtenidos de Entra ID:', roles);
      }
    }
  }

  // 3. Método para probar la petición al BFF
  probarBff(): void {
    console.log('Llamando a http://localhost:8083/api/catalog/services ...');

    this.http.get('http://localhost:8083/api/catalog/services').subscribe({
      next: (data) => {
        console.log('✅ ¡Éxito! Respuesta del BFF y Catálogo:', data);
        alert('¡Conexión exitosa! Revisa la consola F12 para ver los datos.');
      },
      error: (error) => {
        console.error('❌ Error al llamar al BFF:', error);
        alert(`Error: ${error.status} - ${error.statusText || 'Revisa la consola'}`);
      }
    });
  }

  cambiarRolSimulado(event: any): void {
    this.userRole = event.target.value;
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}