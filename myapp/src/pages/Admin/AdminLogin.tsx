import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaShieldAlt } from 'react-icons/fa';
import { api } from '../../services/api';
import './AdminLogin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(password);
      if (res.success) {
        navigate('/admin');
      } else {
        setError(res.message || 'Invalid administrator password');
      }
    } catch (err: unknown) {
      console.error('[Login Error]', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <FaShieldAlt />
        </div>
        <h2>Administrator Portal</h2>
        <p className="admin-login-subtitle">
          Secure content management & event operations for KELO Handcrafted Gifts.
        </p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-field">
            <label htmlFor="admin-pass">Master Passphrase</label>
            <div className="input-with-icon">
              <FaLock className="field-icon" />
              <input
                id="admin-pass"
                type="password"
                required
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-admin-login">
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="admin-security-note">
          🔒 Enforced by server-side bcrypt authorization & HttpOnly sessions.
        </p>
      </div>
    </div>
  );
}
