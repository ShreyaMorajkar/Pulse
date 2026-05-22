import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await register(form.email, form.username, form.displayName, form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <h1>Join Pulse</h1>
        <p className="subtitle">Create your account and start connecting</p>
        {error && <div className="error-msg">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input id="displayName" value={form.displayName} onChange={update('displayName')} placeholder="Your Name" required />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" value={form.username} onChange={update('username')} placeholder="yourhandle" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" value={form.password} onChange={update('password')} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
