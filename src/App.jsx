import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SigninPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import PublicRoute from "./pages/PublicRoute";
import UsernameRoute from "./components/UsernameRoute";
import Toast from "./components/Toast";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes without MainLayout */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/signin" element={
          <PublicRoute>
            <SignInPage />
          </PublicRoute>
        } />
        
        {/* Username-based protected routes */}
        <Route path="/:username" element={<UsernameRoute page="dashboard" />} />
        <Route path="/:username/candidates" element={<UsernameRoute page="candidates" />} />
        <Route path="/:username/faq" element={<UsernameRoute page="faq" />} />
        <Route path="/:username/votes" element={<UsernameRoute page="votes" />} />
        <Route path="/:username/users" element={<UsernameRoute page="users" />} />
        {/* Catch-all route for unknown paths - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </Router>
  );
}

export default App;
