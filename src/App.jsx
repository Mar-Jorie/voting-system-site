import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SigninPage";
import FAQPage from "./pages/FAQPage";
import VotesListPage from "./pages/VotesListPage";
import DashboardPage from "./pages/DashboardPage";
import CandidatesPage from "./pages/CandidatesPage";
import UsersPage from "./pages/UsersPage";
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Toast from "./components/Toast";
import "./utils/initMockData"; // Initialize mock data

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes without MainLayout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        
        {/* Protected routes with MainLayout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/candidates" element={
          <ProtectedRoute>
            <MainLayout>
              <CandidatesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
                <Route path="/faq" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <FAQPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/votes" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <VotesListPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
        <Route path="/users" element={
          <ProtectedRoute>
            <MainLayout>
              <UsersPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <MainPage />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
      <Toast />
    </Router>
  );
}

export default App;
