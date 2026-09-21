import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

// Importa usando el nombre exacto de la clase que está dentro de los archivos
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Workorders } from './components/workorders/workorders';
import { Catalog } from './components/catalog/catalog';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [MsalGuard] },
  { path: 'workorders', component: Workorders, canActivate: [MsalGuard] },
  { path: 'catalog', component: Catalog, canActivate: [MsalGuard] },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];