import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

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
  userRole: string = '';
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
        scopes: [environment.api.scope],
        account: account
      }).subscribe({
        next: (response) => {
          try {
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            if (payload.roles && payload.roles.length > 0) {
              let r = payload.roles[0].toUpperCase();
              if (r.startsWith('ROLE_')) r = r.substring(5);
              this.userRole = r;
            } else {
              this.userRole = 'CLIENTE';
            }
          } catch {
            this.userRole = 'CLIENTE';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          const idRoles = (account.idTokenClaims as any)?.roles;
          if (idRoles && idRoles.length > 0) {
            let r = idRoles[0].toUpperCase();
            if (r.startsWith('ROLE_')) r = r.substring(5);
            this.userRole = r;
          } else {
            this.userRole = 'CLIENTE';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.detectChanges();
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }

  probarBff(): void {
    this.http.get(`${environment.api.bffUrl}/catalog/services`).subscribe({
      next: (data) => console.log('BFF Conectado exitosamente vía AWS API Gateway:', data),
      error: (err) => console.error('Error al conectar con BFF:', err)
    });
  }
}
