export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_REACT_APP_CLIENT_ID,
    authority: import.meta.env.VITE_REACT_APP_AUTHORITY,
    redirectUri: import.meta.env.VITE_REACT_APP_REDIRECT_URI
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: [import.meta.env.VITE_REACT_APP_API_SCOPE]
};
