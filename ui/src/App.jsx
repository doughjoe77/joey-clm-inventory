import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { MsalAuthenticationTemplate } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import CertificatesPage from "./pages/CertificatesPage";
import { loginRequest } from "./msalConfig";

function Home() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>Entra External ID SPA</h1>
      <p>
        <Link to="/certificates">View Certificate Inventory</Link>
      </p>
    </div>
  );
}

function App() {
  return (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      authenticationRequest={loginRequest}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/certificates" element={<CertificatesPage />} />
      </Routes>
    </MsalAuthenticationTemplate>
  );
}

export default App;
