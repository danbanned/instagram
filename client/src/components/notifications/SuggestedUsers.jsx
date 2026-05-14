import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FollowButton from '../FollowButton';
import { fetchSuggestedUsers } from '../../services/notificationService';
import styles from './SuggestedUsers.module.css';

export default function SuggestedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSuggestedUsers();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className={styles.loading}>Loading suggestions...</div>;
  if (!users.length) return null;

  return (
    <section className={styles.suggestedUsers}>
      <div className={styles.header}>
        <h3>Suggested for you</h3>
        <button type="button" className={styles.seeAll}>See All</button>
      </div>

      <div className={styles.userList}>
        {users.map((user) => (
          <div key={user.id} className={styles.userItem}>
            <Link to={`/profile/${user.id}`}>
              <img src={user.avatar || '/default-avatar.png'} alt={user.username} className={styles.avatar} />
            </Link>
            <div className={styles.userInfo}>
              <div className={styles.username}>{user.username}</div>
              <div className={styles.meta}>
                {user.fullName && <span>{user.fullName}</span>}
                {user.followedBy && <span>Followed by {user.followedBy}</span>}
                {!user.followedBy && <span>Suggested for you</span>}
              </div>
            </div>
            <FollowButton
              userId={user.id}
              initialIsFollowing={user.isFollowing}
              variant="chip"
              onFollowChange={(isFollowing) => {
                setUsers((prev) => prev.map((entry) => (
                  entry.id === user.id ? { ...entry, isFollowing } : entry
                )));
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
