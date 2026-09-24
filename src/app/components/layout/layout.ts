import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss']
})
export class LayoutComponent implements OnInit {
  private msalService = inject(MsalService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  userName: string = '';
  userRole: string = '';
  sidebarOpen: boolean = true;

  ngOnInit(): void {
    const account = this.authService.getAccount();
    if (account) {
      this.userName = account.name || account.username;
      this.authService.getUserRole().subscribe({
        next: (role) => {
          this.userRole = role;
          this.cdr.detectChanges();
        },
        error: () => {
          this.userRole = 'CLIENTE';
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
