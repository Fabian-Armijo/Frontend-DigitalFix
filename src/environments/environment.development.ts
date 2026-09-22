export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '088bf033-6ebb-441c-862d-7b6fcc60a5e8',
      authority: 'https://login.microsoftonline.com/cac38dd3-e614-48df-967a-3c9e4396eae3',
      redirectUri: 'http://localhost:4200/',
      postLogoutRedirectUri: 'http://localhost:4200/login'
    }
  },
  api: {
    bffUrl: 'http://localhost:8083/api',
    scope: 'api://e0877608-03e1-4d4b-a0c9-d50d0ddbdb7c/access_as_user'
  }
};
