export default function NotificationPanel({ notifications, onMarkRead }) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <aside className="card notifications">
      <div className="row">
        <h2>Notifications</h2>
        <button onClick={onMarkRead}>Mark Read</button>
      </div>
      <p>{unreadCount} unread</p>
      <ul>
        {notifications.map((n) => (
          <li key={n._id} className={n.isRead ? 'read' : 'unread'}>
            <strong>@{n.sender?.username}</strong> {n.message}
          </li>
        ))}
      </ul>
    </aside>
  );
}
