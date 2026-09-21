import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { MsalRedirectComponent } from '@azure/msal-angular'; // Importación obligatoria

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    // Inicializa el componente que atrapa la respuesta de Microsoft Entra ID
    appRef.bootstrap(MsalRedirectComponent);
  })
  .catch((err) => console.error(err));
