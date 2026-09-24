import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

// Importaciones de vistas
import { LoginComponent } from './components/login/login';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Workorders } from './components/workorders/workorders';
import { Catalog } from './components/catalog/catalog';

export const routes: Routes = [
  // Redirección de la raíz a la pantalla de login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Ruta pública sin menú lateral (Login)
  { path: 'login', component: LoginComponent },

  // Rutas protegidas que comparten el menú lateral y barra superior (Layout)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'workorders', component: Workorders },
      { path: 'catalog', component: Catalog }
    ]
  },

  // Redirección por defecto para cualquier ruta no encontrada
  { path: '**', redirectTo: 'login' }
];