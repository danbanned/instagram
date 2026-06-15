import LeftSidebar from './LeftSidebar';
import FloatingMessagesBox from './FloatingMessagesBox';
import useAuth from '../hooks/useAuth';

export default function MainLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <div className="main-container">
        <LeftSidebar user={user} />
        {children}
      </div>
      <FloatingMessagesBox />
    </div>
  );
}
