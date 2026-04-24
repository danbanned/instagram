import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import FeedPage      from './pages/FeedPage';
import ProfilePage   from './pages/NewProfilePage';
import CreatePage    from './pages/CreatePage';
import SearchPage    from './pages/SearchPage';
import ExplorePage   from './pages/ExplorePage';
import ReelsPage     from './pages/ReelsPage';
import MessagesPage  from './pages/MessagesPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage  from './pages/SettingsPage';
import useAuth       from './hooks/useAuth';
import MainLayout    from './components/MainLayout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="centered">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/"                element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/search"          element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/explore"         element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
      <Route path="/reels"           element={<PrivateRoute><ReelsPage /></PrivateRoute>} />
      <Route path="/messages"        element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
      <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/create"          element={<PrivateRoute><CreatePage /></PrivateRoute>} />
      <Route path="/dashboard"       element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/settings"        element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
