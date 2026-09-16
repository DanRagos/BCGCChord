import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'musician' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border rounded px-3 py-2';
  const inputStyle = { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Create an account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required placeholder="Full name" className={inputClass} style={inputStyle}
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Username" className={inputClass} style={inputStyle}
          value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input required type="password" placeholder="Password (min 8 characters)" className={inputClass} style={inputStyle}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className={inputClass} style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="musician">Musician</option>
          <option value="worshipLead">Worship Leader</option>
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button disabled={submitting} className="w-full rounded px-3 py-2 font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm mt-3 opacity-70">
        Already have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
