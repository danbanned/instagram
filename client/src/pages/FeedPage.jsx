import { useCallback, useEffect, useState } from 'react';
import { fetchFeed } from '../services/postService';
import { fetchNotifications, markNotificationsRead } from '../services/notificationService';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import Navbar from '../components/Navbar';
import PostComposer from '../components/PostComposer';
import FeedList from '../components/FeedList';
import NotificationPanel from '../components/NotificationPanel';

export default function FeedPage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadFeed = useCallback(async () => {
    const data = await fetchFeed();
    setPosts(data);
  }, []);

  const loadNotifications = useCallback(async () => {
    const data = await fetchNotifications();
    setNotifications(data);
  }, []);

  useSocket(user?.id || user?._id, (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  });

  useEffect(() => {
    loadFeed();
    loadNotifications();
  }, [loadFeed, loadNotifications]);

  const markRead = async () => {
    await markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <main className="app-shell">
      <Navbar user={user} onLogout={logout} />
      <section className="content-grid">
        <div>
          <PostComposer onCreated={loadFeed} />
          <FeedList posts={posts} onMutate={loadFeed} currentUser={user} />
        </div>
        <NotificationPanel notifications={notifications} onMarkRead={markRead} />
      </section>
    </main>
  );
}
