import React from "react";
import { createRoot } from "react-dom/client";
import App from "../../src/App";

import "./styles/index.css"; // si tu as un fichier global de styles

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
