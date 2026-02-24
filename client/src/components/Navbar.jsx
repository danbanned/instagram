export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <h1>Instagram Clone</h1>
      <div className="navbar-right">
        <span>@{user?.username}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
