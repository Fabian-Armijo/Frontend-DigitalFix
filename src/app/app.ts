import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router'; // Inyectar Router
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  
  // Agregamos private router: Router
  constructor(private msalService: MsalService, private router: Router) {}

  ngOnInit(): void {
    this.msalService.instance.initialize().then(() => {
      this.msalService.handleRedirectObservable().subscribe({
        next: (result) => {
          if (result && result.account) {
            this.msalService.instance.setActiveAccount(result.account);
            console.log('Login exitoso. Usuario:', result.account.username);
            // Redirección automática tras iniciar sesión
            this.router.navigate(['/dashboard']); 
          }
        },
        error: (error) => console.error('Error procesando la redirección:', error)
      });
    });
  }
}