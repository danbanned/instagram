import { Link } from 'react-router-dom';
import { SafeImage } from '../../utils/media';
import FollowButton from '../FollowButton';
import styles from './UserResultCard.module.css';

export default function UserResultCard({ user, onSelect, onUpdate }) {
  return (
    <div className={styles.card}>
      <Link
        to={`/profile/${user.id}`}
        className={styles.identity}
        onClick={() => onSelect?.({
          id: `account:${user.id}`,
        type: 'account',
        label: user.username,
        secondaryText: user.name || user.username,
        avatar: user.avatar
        })}
      >
        <SafeImage src={user.avatar || '/default-avatar.png'} alt={user.username} className={styles.avatar} />
        <div className={styles.meta}>
          <span className={styles.username}>{user.username}</span>
          <span className={styles.name}>{user.name || user.username}</span>
          {user.bio && <span className={styles.bio}>{user.bio}</span>}
        </div>
      </Link>

      <FollowButton
        userId={user.id}
        initialIsFollowing={user.isFollowing}
        onFollowChange={(isFollowing) => onUpdate?.({ ...user, isFollowing })}
      />
    </div>
  );
}
