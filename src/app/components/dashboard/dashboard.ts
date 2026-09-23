import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private msalService = inject(MsalService);
  private router = inject(Router);

  userRole: string = '';

  ngOnInit(): void {
    let account = this.msalService.instance.getActiveAccount();
    if (!account && this.msalService.instance.getAllAccounts().length > 0) {
      account = this.msalService.instance.getAllAccounts()[0];
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
              : 'CLIENTE';
          } catch {
            this.userRole = 'CLIENTE';
          }

          if (this.userRole !== 'ADMIN') {
            this.router.navigate(['/workorders']);
          }
        },
        error: () => {
          const roles = (account.idTokenClaims as any)?.roles;
          this.userRole = (roles && roles.length > 0) ? roles[0].toUpperCase() : 'CLIENTE';
          if (this.userRole !== 'ADMIN') {
            this.router.navigate(['/workorders']);
          }
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }
}