export const environment = {
  production: false,
  
  // Configuración para Microsoft Entra ID (MSAL)
  msalConfig: {
    auth: {
      // Reemplaza con el ID de la Aplicación (cliente) de tu App Registration en Azure
      clientId: '51bae0c8-8c21-4aa5-808a-83c58e013259', 
      
      // Reemplaza la última parte con el ID de Directorio (inquilino/tenant) de Azure
      authority: 'https://login.microsoftonline.com/f01230ab-9e94-4c94-8ce2-d2c2b31558dc', 
      
      // La URL exacta donde Entra ID devolverá el token (debe coincidir con Azure)
      redirectUri: 'http://localhost:4200/', 
      
      // A dónde redirigir al usuario después de hacer Logout
      postLogoutRedirectUri: 'http://localhost:4200/login'
    }
  },

  // Configuración de las rutas hacia tu Backend For Frontend (BFF)
  api: {
    // URL base de tu BFF y API Gateway que centraliza las peticiones
    bffUrl: 'http://localhost:8083/api'
  }
};
