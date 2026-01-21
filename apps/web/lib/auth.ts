import { PublicClientApplication } from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "";
const authority = process.env.NEXT_PUBLIC_AZURE_AUTHORITY || "https://login.microsoftonline.com/common";
const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "http://localhost:3000/login";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority,
    redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
});

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

export const apiRequest = {
  scopes: ["https://management.azure.com/.default"],
};

