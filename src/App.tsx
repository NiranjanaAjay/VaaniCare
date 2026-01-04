import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage, ConversationPage } from "./pages";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/conversation/:serviceType"
          element={<ConversationPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
