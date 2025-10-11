// src/App.jsx
import "./App.css";
import { ModalProvider } from "./contexts/modalContext";
import RoutesPage from "./components/Routes/index";

function App() {
  return (
    <ModalProvider>
      <RoutesPage />
    </ModalProvider>
  );
}

export default App;
