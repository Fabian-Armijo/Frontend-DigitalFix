import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  private msalService = inject(MsalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Si ya existe una sesión activa, no mostrar login y redirigir directamente
    const account = this.msalService.instance.getActiveAccount()
      || (this.msalService.instance.getAllAccounts().length > 0 ? this.msalService.instance.getAllAccounts()[0] : null);

    if (account) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    }
  }

  onMicrosoftLogin(): void {
    // Ejecuta el flujo oficial de redirección hacia Microsoft Entra ID
    this.msalService.loginRedirect();
  }
}