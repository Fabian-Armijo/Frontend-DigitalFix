import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  constructor() { }

  onMockLogin(): void {
    alert('Este formulario es una maqueta. Posteriormente utilizaremos Microsoft Entra ID.');
  }

  onMicrosoftLogin(): void {
    // Aquí implementaremos posteriormente MSAL (MsalService.loginRedirect())
    console.log('Iniciando redirección a Microsoft Entra ID...');
    alert('Aquí se ejecutará la redirección de MSAL configurada para DigitalFix.');
  }
}