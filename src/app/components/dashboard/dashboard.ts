import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  userRole: string = 'SUPERVISOR';

  ngOnInit(): void {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      const roles = (account.idTokenClaims as any)?.roles;
      if (roles && roles.length > 0) {
        this.userRole = roles[0].toUpperCase();
      }
    }
  }
}