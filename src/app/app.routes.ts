import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

// Importaciones de vistas
import { LoginComponent } from './components/login/login';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Workorders } from './components/workorders/workorders';
import { Catalog } from './components/catalog/catalog';

export const routes: Routes = [
  // Ruta pública sin menú lateral
  { path: 'login', component: LoginComponent },

  // Rutas protegidas que comparten el menú lateral y barra superior (Layout)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [MsalGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'workorders', component: Workorders },
      { path: 'catalog', component: Catalog },
      { path: '', redirectTo: 'workorders', pathMatch: 'full' }
    ]
  },

  // Redirección por defecto
  { path: '**', redirectTo: '/login' }
];