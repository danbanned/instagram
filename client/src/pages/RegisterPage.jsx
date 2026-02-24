import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create Account</h1>
        <input name="username" placeholder="Username" value={form.username} onChange={onChange} required />
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign Up</button>
        <p>Have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
