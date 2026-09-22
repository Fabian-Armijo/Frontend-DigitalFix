import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from '../environments/environment';

// Importaciones de Microsoft MSAL
import { 
  MSAL_INSTANCE, 
  MSAL_GUARD_CONFIG, 
  MSAL_INTERCEPTOR_CONFIG, 
  MsalService, 
  MsalGuard, 
  MsalBroadcastService, 
  MsalInterceptor, 
  MsalGuardConfiguration, 
  MsalInterceptorConfiguration 
} from '@azure/msal-angular';
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from '@azure/msal-browser';

// 1. Configuración principal de la instancia MSAL
export function MSALInstanceFactory() {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.auth.clientId,
      authority: environment.msalConfig.auth.authority,
      redirectUri: environment.msalConfig.auth.redirectUri,
      postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
    }
  });
}

// 2. Configuración del Interceptor (AQUÍ ESTÁ EL CAMBIO CLAVE)
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Asociamos cualquier llamada a http://localhost:8083/api/* con el Scope de tu Backend
  protectedResourceMap.set(`${environment.api.bffUrl}/*`, [environment.api.scope]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

// 3. Configuración del Guard
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    authRequest: { 
      // Pedimos tanto user.read como el scope de tu API desde el inicio de sesión
      scopes: ['user.read', environment.api.scope] 
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};