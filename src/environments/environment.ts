export const environment = {
  production: false,
  
  // Configuración para Microsoft Entra ID (MSAL)
  msalConfig: {
    auth: {
      // Reemplaza con el ID de la Aplicación (cliente) de tu App Registration en Azure
      clientId: '088bf033-6ebb-441c-862d-7b6fcc60a5e8', 
      
      // Reemplaza la última parte con el ID de Directorio (inquilino/tenant) de Azure
      authority: 'https://login.microsoftonline.com/cac38dd3-e614-48df-967a-3c9e4396eae3', 
      
      // La URL exacta donde Entra ID devolverá el token (debe coincidir con Azure)
      redirectUri: 'http://localhost:4200/', 
      
      // A dónde redirigir al usuario después de hacer Logout
      postLogoutRedirectUri: 'http://localhost:4200/login'
    }
  },
  api: {
    // La URL base del BFF (puerto 8083)
    bffUrl: 'http://localhost:8083/api',
    // El Scope que expusiste en Azure para tu backend:
    scope: 'api://e0877608-03e1-4d4b-a0c9-d50d0ddbdb7c/access_as_user'
  }
};
