import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate          = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [pass,  setPass ] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, pass);
    if (ok) navigate('/');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(900px 600px at 50% 0%, oklch(0.28 0.05 258 / 0.4), transparent 60%), var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(150deg, var(--accent), var(--accent-2))',
            display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px oklch(0.66 0.17 252 / 0.4)',
          }}>
            <Icons.sat size={26} stroke="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Starlink Control</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Panel de administración</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--r)',
          padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Correo electrónico</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoFocus
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10,
                padding: '10px 14px', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Contraseña</label>
            <input
              type="password" value={pass} onChange={(e) => setPass(e.target.value)}
              required
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10,
                padding: '10px 14px', color: 'var(--text)', font: 'inherit', fontSize: 14, outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--line)'}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--risk-bg)', color: 'var(--risk)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 0', font: 'inherit', fontWeight: 700, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
