import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular'; // Importamos el servicio

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  // Inyectamos el servicio de MSAL en el constructor
  constructor(private msalService: MsalService) { }

  onMockLogin(): void {
    alert('Por favor, utiliza el inicio de sesión oficial con Microsoft Entra ID.');
  }

  onMicrosoftLogin(): void {
    // Esto ejecutará el flujo de redirección hacia Microsoft Entra ID[cite: 1]
    this.msalService.loginRedirect();
  }
}