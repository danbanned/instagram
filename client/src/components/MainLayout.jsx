import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import useAuth from '../hooks/useAuth';

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <Navbar user={user} onLogout={logout} />
      
      <div className="main-container">
        <LeftSidebar user={user} />
        
        {children}
      </div>
    </div>
  );
}
