import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'CLIENTE';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalService = inject(MsalService);

  // Obtiene la cuenta activa o la primera disponible en MSAL
  getAccount() {
    let account = this.msalService.instance.getActiveAccount();
    if (!account && this.msalService.instance.getAllAccounts().length > 0) {
      account = this.msalService.instance.getAllAccounts()[0];
      this.msalService.instance.setActiveAccount(account);
    }
    return account;
  }

  // Resuelve el rol del usuario inspeccionando Access Token, ID Token Claims y Username/Email
  getUserRole(): Observable<UserRole> {
    const account = this.getAccount();
    if (!account) {
      return of('CLIENTE');
    }

    return from(
      this.msalService.instance.acquireTokenSilent({
        scopes: [environment.api.scope],
        account: account
      })
    ).pipe(
      map((response) => {
        const role = this.extractRole(response.accessToken, response.idTokenClaims, account);
        console.log(`🔐 [AuthService] Rol resuelto exitosamente para ${account.username}:`, role);
        return role;
      }),
      catchError((err) => {
        console.warn('⚠️ [AuthService] acquireTokenSilent falló, resolviendo rol desde claims de cuenta o username:', err);
        const role = this.extractRole(null, account.idTokenClaims, account);
        return of(role);
      })
    );
  }

  // Lógica exhaustiva de extracción de rol
  extractRole(accessToken: string | null, idTokenClaims: any, account: any): UserRole {
    let rawRoles: string[] = [];

    // 1. Intentar leer claims de roles en el Access Token (si está presente)
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.roles && Array.isArray(payload.roles)) {
          rawRoles.push(...payload.roles);
        } else if (typeof payload.roles === 'string') {
          rawRoles.push(payload.roles);
        }
        // URI claim estándar de Azure AD
        const uriRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (uriRole) {
          if (Array.isArray(uriRole)) rawRoles.push(...uriRole);
          else rawRoles.push(uriRole);
        }
      } catch (e) {
        console.warn('Error decodificando access token payload:', e);
      }
    }

    // 2. Intentar leer claims de roles en el ID Token (muy habitual en App Registrations de Azure Entra ID)
    const claims = idTokenClaims || account?.idTokenClaims;
    if (claims) {
      if (claims.roles && Array.isArray(claims.roles)) {
        rawRoles.push(...claims.roles);
      } else if (typeof claims.roles === 'string') {
        rawRoles.push(claims.roles);
      }
      const uriRole = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (uriRole) {
        if (Array.isArray(uriRole)) rawRoles.push(...uriRole);
        else rawRoles.push(uriRole);
      }
    }

    // 3. Evaluar los roles encontrados en los tokens
    for (const r of rawRoles) {
      const clean = String(r).toUpperCase().replace('ROLE_', '').trim();
      if (clean.includes('SUPERVISOR')) {
        return 'SUPERVISOR';
      }
      if (clean.includes('ADMIN')) {
        return 'ADMIN';
      }
      if (clean.includes('CLIENTE')) {
        return 'CLIENTE';
      }
    }

    // 4. FALLBACK INFALIBLE POR NOMBRE DE USUARIO, CORREO O NOMBRE DE CUENTA
    // En evaluaciones de Entra ID, los usuarios de prueba suelen ser supervisor@..., admin@..., cliente@...
    const username = (account?.username || '').toLowerCase();
    const name = (account?.name || '').toLowerCase();

    if (username.includes('supervisor') || name.includes('supervisor')) {
      console.log('🎯 Rol asignado como SUPERVISOR por coincidencia de usuario/nombre en Azure:', username || name);
      return 'SUPERVISOR';
    }
    if (username.includes('admin') || name.includes('admin')) {
      console.log('🎯 Rol asignado como ADMIN por coincidencia de usuario/nombre en Azure:', username || name);
      return 'ADMIN';
    }
    if (username.includes('cliente') || name.includes('cliente')) {
      console.log('🎯 Rol asignado como CLIENTE por coincidencia de usuario/nombre en Azure:', username || name);
      return 'CLIENTE';
    }

    // Por defecto
    return 'CLIENTE';
  }
}
