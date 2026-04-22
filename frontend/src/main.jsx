import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";   // ✅ ADD THIS LINE
import App from "./App.jsx";
import Admin from "./Admin.jsx";

function Main() {
  const path = window.location.pathname;

  if (path === "/admin") return <Admin />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);