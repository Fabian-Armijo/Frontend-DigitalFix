export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '51bae0c8-8c21-4aa5-808a-83c58e013259',
      authority: 'https://login.microsoftonline.com/f01230ab-9e94-4c94-8ce2-d2c2b31558dc',
      redirectUri: 'http://localhost:4200/',
      postLogoutRedirectUri: 'http://localhost:4200/login'
    }
  },
  api: {
    bffUrl: 'https://y9alroweth.execute-api.us-east-1.amazonaws.com/api',
    scope: 'api://ece96448-d15c-403e-9525-fefc4f9378a1/access_as_user'
  }
};
