import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SigninPage";
import SignUpPage from "./pages/SignupPage";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import "./utils/initMockData"; // Initialize mock data

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/*" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
