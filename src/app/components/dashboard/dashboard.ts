import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // Importaciones necesarias para el HTML
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  // Simularemos el rol por ahora. Las opciones para tu caso son: 'ADMIN', 'SUPERVISOR', 'CLIENTE'
  userRole: string = 'SUPERVISOR'; 

  constructor(private msalService: MsalService) {}

  ngOnInit(): void {
    // Obtenemos la cuenta activa de MSAL para mostrar el correo en pantalla
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.userName = account.username;
    }
  }

  // Método temporal para probar las vistas visualmente
  cambiarRolSimulado(event: any): void {
    this.userRole = event.target.value;
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}