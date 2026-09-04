import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: 'admin@sgld.com.br',
    password: '123456',
  });
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(nextMode === 'register'
      ? { name: '', email: '', password: '' }
      : { name: '', email: 'admin@sgld.com.br', password: '123456' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? {
          email: form.email,
          password: form.password,
        } : form),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || `Erro ao ${mode === 'login' ? 'entrar' : 'criar a conta'}.`);
        return;
      }

      if (mode === 'login') {
        onAuthenticated(data);
      } else {
        alert('Conta criada com sucesso. Agora entre com suas credenciais.');
        setForm({ name: '', email: form.email, password: '' });
        setMode('login');
      }
    } catch {
      alert('Não foi possível conectar com o backend. Verifique se o servidor está rodando em http://localhost:3001');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">SGLD</p>
        <h1>{mode === 'login' ? 'Entrar no sistema' : 'Criar nova conta'}</h1>
        {mode === 'register' && (
          <label>
            Nome
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
        )}
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <button className="primary-btn full-width" type="submit" disabled={loading}>
          {loading
            ? (mode === 'login' ? 'Acessando...' : 'Criando conta...')
            : (mode === 'login' ? 'Acessar painel' : 'Criar conta')}
        </button>
        {mode === 'login' ? (
          <>
            <button type="button" className="secondary-btn full-width" onClick={() => switchMode('register')}>
              Criar nova conta
            </button>
            <small>Usuário demo: admin@sgld.com.br / 123456</small>
          </>
        ) : (
          <button type="button" className="secondary-btn full-width" onClick={() => switchMode('login')}>
            Já tenho uma conta
          </button>
        )}
      </form>
    </div>
  );
}

export default Login;
