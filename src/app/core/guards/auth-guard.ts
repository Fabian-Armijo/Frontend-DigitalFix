import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

export const authGuard: CanActivateFn = (route, state) => {
  const msalService = inject(MsalService);
  const router = inject(Router);

  let account = msalService.instance.getActiveAccount();
  if (!account && msalService.instance.getAllAccounts().length > 0) {
    account = msalService.instance.getAllAccounts()[0];
    msalService.instance.setActiveAccount(account);
  }

  if (account) {
    return true;
  }

  // Redirige de forma segura a la pantalla de login guardando la URL intentada
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
