import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from '../environments/environment.development';

// Importaciones de Microsoft MSAL
import { MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor, MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
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

// 2. Configuración del Interceptor (Adjuntará el Access Token a las peticiones hacia el BFF)
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Protegemos la ruta del BFF para que MSAL adjunte el token automáticamente[cite: 1]
  // El scope "user.read" es por defecto para pruebas, luego lo ajustaremos al scope de tu BFF si es necesario.
  protectedResourceMap.set(environment.api.bffUrl, ['user.read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

// 3. Configuración del Guard (Protegerá las rutas del frontend)[cite: 1]
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: ['user.read'] }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // Necesario para hacer peticiones HTTP
    // Proveedores de MSAL exigidos por la arquitectura[cite: 1]
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};