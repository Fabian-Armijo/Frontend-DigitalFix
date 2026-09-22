import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss']
})
export class LayoutComponent implements OnInit {
  private msalService = inject(MsalService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  userName: string = '';
  userRole: string = 'SUPERVISOR';
  sidebarOpen: boolean = true;

  ngOnInit(): void {
    let account = this.msalService.instance.getActiveAccount();
    if (!account && this.msalService.instance.getAllAccounts().length > 0) {
      account = this.msalService.instance.getAllAccounts()[0];
      this.msalService.instance.setActiveAccount(account);
    }

    if (account) {
      this.userName = account.username;
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
          this.cdr.detectChanges();
        },
        error: () => {
          this.userRole = 'ADMIN';
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.detectChanges();
  }

  cambiarRolSimulado(event: any): void {
    this.userRole = event.target.value;
    this.cdr.detectChanges();
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }

  probarBff(): void {
    this.http.get('http://localhost:8083/api/catalog/services').subscribe({
      next: (data) => console.log('BFF Conectado exitosamente:', data),
      error: (err) => console.error('Error al conectar con BFF:', err)
    });
  }
}
