import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // 1. Importación obligatoria para las rutas
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true, // Indica que es Standalone
  imports: [RouterOutlet], // 2. Debes declarar RouterOutlet aquí
  templateUrl: './app.html', // (o './app.component.html' según tu archivo)
  styleUrls: ['./app.scss'] // (o './app.scss')
})
export class AppComponent implements OnInit {
  
  constructor(private msalService: MsalService) {}

  ngOnInit(): void {
    this.msalService.instance.initialize().then(() => {
      this.msalService.handleRedirectObservable().subscribe({
        next: (result) => {
          if (result && result.account) {
            this.msalService.instance.setActiveAccount(result.account);
            console.log('Login exitoso. Usuario:', result.account.username);
          }
        },
        error: (error) => console.error('Error procesando la redirección:', error)
      });
    });
  }
}