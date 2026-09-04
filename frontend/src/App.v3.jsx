import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { PieChart, LineChart } from './ChartComponent';

const API_URL = 'http://localhost:3001/api';

const emptyForm = {
  title: '',
  documentType: 'alvara',
  category: 'legal',
  issuingBody: '',
  status: 'em_dia',
  issueDate: '',
  expirationDate: '',
  responsible: '',
  fileUrl: '',
  notificationDays: 30,
  condominiumId: 1,
  buildingId: 1,
};

const emptyCondominiumForm = {
  name: '',
  cnpj: '',
  address: '',
  city: '',
  state: '',
  email: '',
  phone: '',
};

const emptyBuildingForm = {
  name: '',
  address: '',
  totalUnits: '',
  condominiumId: 1,
};

const DOCUMENT_TYPE_LABELS = {
  alvara: 'Alvará',
  vistoria: 'Vistoria',
  laudo: 'Laudo',
  seguro: 'Seguro',
  outro: 'Outro',
};

const STATUS_LABELS = {
  em_dia: 'Em dia',
  proximo_vencimento: 'Próximo do vencimento',
  vencido: 'Vencido',
};

const formatDocumentValue = (value, labels) => labels[value] || value;

function App() {
  const [documents, setDocuments] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [condominiumForm, setCondominiumForm] = useState(emptyCondominiumForm);
  const [buildingForm, setBuildingForm] = useState(emptyBuildingForm);
  const [auth, setAuth] = useState({ token: '', user: null });
  const [loginForm, setLoginForm] = useState({ email: 'admin@sgld.com.br', password: '123456' });
  const [view, setView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingDocuments, setUpcomingDocuments] = useState([]);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const token = localStorage.getItem('sgld_token');
    if (!token) return;

    try {
      const [documentsRes, buildingsRes, condominiumsRes, dashboardRes, upcomingRes] = await Promise.all([
        fetch(`${API_URL}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/buildings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/condominiums`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/dashboard/upcoming`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const documentsData = await documentsRes.json();
      const buildingsData = await buildingsRes.json();
      const condominiumsData = await condominiumsRes.json();
      const upcomingData = await upcomingRes.json();

      setDocuments(documentsData);
      setBuildings(buildingsData);
      setCondominiums(condominiumsData);
      setUpcomingDocuments(upcomingData);
      setAuth({ token, user: JSON.parse(localStorage.getItem('sgld_user') || 'null') });
      setView((current) => current || 'dashboard');

      if (condominiumsData[0]) {
        setForm((current) => ({
          ...current,
          condominiumId: condominiumsData[0].id,
          buildingId: buildingsData[0]?.id || 1,
        }));
        setBuildingForm((current) => ({
          ...current,
          condominiumId: condominiumsData[0].id,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('sgld_token');
    if (token) {
      loadData();
    }
  }, []);

  const dashboardStats = useMemo(() => {
    const total = documents.length;
    const emDia = documents.filter((doc) => doc.status === 'em_dia').length;
    const proximo = documents.filter((doc) => doc.status === 'proximo_vencimento').length;
    const vencido = documents.filter((doc) => doc.status === 'vencido').length;

    return { total, emDia, proximo, vencido };
  }, [documents]);

  const chartData = useMemo(() => {
    return {
      labels: ['Em dia', 'Próximo vencimento', 'Vencidos'],
      values: [dashboardStats.emDia, dashboardStats.proximo, dashboardStats.vencido],
      colors: ['#22c55e', '#f59e0b', '#ef4444'],
    };
  }, [dashboardStats]);

  const categoryData = useMemo(() => {
    const categoryCount = {};
    documents.forEach((doc) => {
      categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
    });
    return {
      labels: Object.keys(categoryCount).map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1)),
      values: Object.values(categoryCount),
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.issuingBody?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [documents, statusFilter, searchTerm]);

  const showDashboard = view === 'dashboard';

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Erro ao entrar. Verifique as credenciais.');
        return;
      }

      localStorage.setItem('sgld_token', data.token);
      localStorage.setItem('sgld_user', JSON.stringify(data.user));
      setAuth({ token: data.token, user: data.user });
      loadData();
    } catch (error) {
      alert('Não foi possível conectar com o backend. Verifique se o servidor está rodando em http://localhost:3001');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('sgld_token');

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (fileInputRef.current?.files[0]) {
      formData.append('file', fileInputRef.current.files[0]);
    }

    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      setForm(emptyForm);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } else {
      alert('Erro ao salvar documento');
    }
  };

  const handleCondominiumSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('sgld_token');

    const response = await fetch(`${API_URL}/condominiums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(condominiumForm),
    });

    if (response.ok) {
      setCondominiumForm(emptyCondominiumForm);
      loadData();
      setView('condominiums');
    } else {
      alert('Erro ao salvar condomínio');
    }
  };

  const handleBuildingSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('sgld_token');

    const response = await fetch(`${API_URL}/buildings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildingForm),
    });

    if (response.ok) {
      setBuildingForm(emptyBuildingForm);
      loadData();
      setView('buildings');
    } else {
      alert('Erro ao salvar bloco');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCondominiumChange = (event) => {
    const { name, value } = event.target;
    setCondominiumForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBuildingChange = (event) => {
    const { name, value } = event.target;
    setBuildingForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('sgld_token');
    localStorage.removeItem('sgld_user');
    setAuth({ token: '', user: null });
    setView('login');
  };

  if (!auth.user) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={handleLogin}>
          <p className="eyebrow">SGLD</p>
          <h1>Entrar no sistema</h1>
          <label>
            E-mail
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            />
          </label>
          <button className="primary-btn full-width" type="submit">Acessar painel</button>
          <small>Usuário demo: admin@sgld.com.br / 123456</small>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">SGLD</p>
          <h1>Gestão documental</h1>
        </div>

        <nav>
          <span className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</span>
          <span className={`nav-item ${view === 'condominiums' ? 'active' : ''}`} onClick={() => setView('condominiums')}>Condomínios</span>
          <span className={`nav-item ${view === 'buildings' ? 'active' : ''}`} onClick={() => setView('buildings')}>Blocos</span>
          <span className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>Documentos</span>
          <span className="nav-item" onClick={handleLogout}>Sair</span>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel do síndico</p>
            <h2>{view === 'dashboard' && 'Análise de documentos'}
                {view === 'condominiums' && 'Gerenciar condomínios'}
                {view === 'buildings' && 'Gerenciar blocos'}
                {view === 'documents' && 'Documentos'}
            </h2>
          </div>
          <div className="user-badge">{auth.user.name}</div>
        </header>

        {view === 'dashboard' && (
          <>
            <section className="metrics-grid">
              <div className="metric-card metric-total">
                <div className="metric-header">
                  <span className="metric-label">Total de documentos</span>
                  <span className="metric-badge">{dashboardStats.total}</span>
                </div>
                <div className="metric-value">{dashboardStats.total}</div>
                <div className="metric-detail">Documentos cadastrados no sistema</div>
              </div>

              <div className="metric-card metric-em-dia">
                <div className="metric-header">
                  <span className="metric-label">Em dia</span>
                </div>
                <div className="metric-value">{dashboardStats.emDia}</div>
                <div className="progress-bar">
                  <div className="progress-fill em-dia" style={{ width: `${dashboardStats.total ? (dashboardStats.emDia / dashboardStats.total) * 100 : 0}%` }}></div>
                </div>
                <div className="metric-detail">{dashboardStats.total ? ((dashboardStats.emDia / dashboardStats.total) * 100).toFixed(0) : 0}% da carteira</div>
              </div>

              <div className="metric-card metric-proximo">
                <div className="metric-header">
                  <span className="metric-label">Próximo vencimento</span>
                </div>
                <div className="metric-value">{dashboardStats.proximo}</div>
                <div className="progress-bar">
                  <div className="progress-fill proximo" style={{ width: `${dashboardStats.total ? (dashboardStats.proximo / dashboardStats.total) * 100 : 0}%` }}></div>
                </div>
                <div className="metric-detail">Necessitam atenção em 30 dias</div>
              </div>

              <div className="metric-card metric-vencido">
                <div className="metric-header">
                  <span className="metric-label">Vencidos</span>
                </div>
                <div className="metric-value">{dashboardStats.vencido}</div>
                <div className="progress-bar">
                  <div className="progress-fill vencido" style={{ width: `${dashboardStats.total ? (dashboardStats.vencido / dashboardStats.total) * 100 : 0}%` }}></div>
                </div>
                <div className="metric-detail">Urgência de renovação</div>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="panel chart-panel">
                <div className="panel-header">
                  <h3>Distribuição por status</h3>
                </div>
                {dashboardStats.total === 0 ? (
                  <div className="empty-state">Sem dados para exibir</div>
                ) : (
                  <PieChart data={chartData} title="Status dos Documentos" />
                )}
              </div>

              <div className="panel chart-panel">
                <div className="panel-header">
                  <h3>Distribuição por categoria</h3>
                </div>
                {documents.length === 0 ? (
                  <div className="empty-state">Sem dados para exibir</div>
                ) : (
                  <LineChart data={categoryData} title="Documentos por Categoria" />
                )}
              </div>

              <div className="panel alert-panel">
                <div className="panel-header">
                  <h3>Próximos vencimentos</h3>
                  <span className="panel-counter">{upcomingDocuments.length}</span>
                </div>
                {upcomingDocuments.length === 0 ? (
                  <div className="empty-state">Nenhum documento próximo ao vencimento.</div>
                ) : (
                  <ul className="upcoming-list">
                    {upcomingDocuments.slice(0, 5).map((doc) => (
                      <li key={doc.id} className="upcoming-item">
                        <div className="upcoming-icon">⚠️</div>
                        <div className="upcoming-content">
                          <div className="upcoming-title">{doc.title}</div>
                          <div className="upcoming-date">Vence: {doc.expirationDate}</div>
                          <div className="upcoming-condominium">{doc.condominium?.name}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="panel form-panel-expanded">
              <h3>Adicionar novo documento</h3>
              <form onSubmit={handleSubmit} className="document-form-grid">
                <div className="field-group">
                  <label>
                    Título
                    <input name="title" value={form.title} onChange={handleChange} placeholder="Ex.: Alvará de funcionamento" />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Tipo
                    <select name="documentType" value={form.documentType} onChange={handleChange}>
                      <option value="alvara">Alvará</option>
                      <option value="vistoria">Vistoria</option>
                      <option value="laudo">Laudo</option>
                      <option value="seguro">Seguro</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Categoria
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="legal">Legal</option>
                      <option value="seguranca">Segurança</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="financeiro">Financeiro</option>
                    </select>
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Órgão emissor
                    <input name="issuingBody" value={form.issuingBody} onChange={handleChange} placeholder="Prefeitura / empresa / consultoria" />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Condomínio
                    <select name="condominiumId" value={form.condominiumId} onChange={handleChange}>
                      {condominiums.map((condominium) => (
                        <option key={condominium.id} value={condominium.id}>{condominium.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Bloco
                    <select name="buildingId" value={form.buildingId} onChange={handleChange}>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>{building.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Data de emissão
                    <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Data de vencimento
                    <input type="date" name="expirationDate" value={form.expirationDate} onChange={handleChange} />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Responsável
                    <input name="responsible" value={form.responsible} onChange={handleChange} placeholder="Nome da empresa ou responsável" />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Notificar antes de (dias)
                    <input type="number" name="notificationDays" value={form.notificationDays} onChange={handleChange} />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Status
                    <select name="status" value={form.status} onChange={handleChange}>
                      <option value="em_dia">Em dia</option>
                      <option value="proximo_vencimento">Próximo do vencimento</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Arquivo
                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                  </label>
                </div>

                <button type="submit" className="primary-btn full-width">Salvar documento</button>
              </form>
            </section>
          </>
        )}

        {view === 'condominiums' && (
          <>
            <section className="panel-grid">
              <div className="panel form-panel">
                <h3>Novo condomínio</h3>
                <form onSubmit={handleCondominiumSubmit} className="document-form">
                  <label>
                    Nome do condomínio
                    <input name="name" value={condominiumForm.name} onChange={handleCondominiumChange} placeholder="Residencial Jardins" required />
                  </label>
                  <label>
                    CNPJ
                    <input name="cnpj" value={condominiumForm.cnpj} onChange={handleCondominiumChange} placeholder="12.345.678/0001-90" />
                  </label>
                  <label>
                    Endereço
                    <input name="address" value={condominiumForm.address} onChange={handleCondominiumChange} placeholder="Rua das Flores, 120" />
                  </label>
                  <div className="field-group two-columns">
                    <label>
                      Cidade
                      <input name="city" value={condominiumForm.city} onChange={handleCondominiumChange} placeholder="São Paulo" />
                    </label>
                    <label>
                      Estado
                      <input name="state" value={condominiumForm.state} onChange={handleCondominiumChange} placeholder="SP" maxLength="2" />
                    </label>
                  </div>
                  <label>
                    E-mail
                    <input name="email" type="email" value={condominiumForm.email} onChange={handleCondominiumChange} placeholder="admin@condominio.com" />
                  </label>
                  <label>
                    Telefone
                    <input name="phone" value={condominiumForm.phone} onChange={handleCondominiumChange} placeholder="(11) 3333-4444" />
                  </label>
                  <button type="submit" className="primary-btn full-width">Salvar condomínio</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Condomínios cadastrados</h3>
                  <span className="panel-counter">{condominiums.length} registros</span>
                </div>
                {condominiums.length === 0 ? (
                  <div className="empty-state">Nenhum condomínio cadastrado.</div>
                ) : (
                  <div className="list-items">
                    {condominiums.map((cond) => (
                      <div key={cond.id} className="list-item">
                        <div className="item-title">{cond.name}</div>
                        <div className="item-meta">{cond.city}, {cond.state} • {cond.cnpj}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {view === 'buildings' && (
          <>
            <section className="panel-grid">
              <div className="panel form-panel">
                <h3>Novo bloco</h3>
                <form onSubmit={handleBuildingSubmit} className="document-form">
                  <label>
                    Nome do bloco
                    <input name="name" value={buildingForm.name} onChange={handleBuildingChange} placeholder="Bloco A" required />
                  </label>
                  <label>
                    Endereço
                    <input name="address" value={buildingForm.address} onChange={handleBuildingChange} placeholder="Rua das Flores, 120, Bloco A" />
                  </label>
                  <label>
                    Total de unidades
                    <input type="number" name="totalUnits" value={buildingForm.totalUnits} onChange={handleBuildingChange} placeholder="48" />
                  </label>
                  <label>
                    Condomínio
                    <select name="condominiumId" value={buildingForm.condominiumId} onChange={handleBuildingChange}>
                      {condominiums.map((cond) => (
                        <option key={cond.id} value={cond.id}>{cond.name}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="primary-btn full-width">Salvar bloco</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Blocos cadastrados</h3>
                  <span className="panel-counter">{buildings.length} registros</span>
                </div>
                {buildings.length === 0 ? (
                  <div className="empty-state">Nenhum bloco cadastrado.</div>
                ) : (
                  <div className="list-items">
                    {buildings.map((building) => (
                      <div key={building.id} className="list-item">
                        <div className="item-title">{building.name}</div>
                        <div className="item-meta">{building.totalUnits} unidades • {condominiums.find((c) => c.id === building.condominiumId)?.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {view === 'documents' && (
          <>
            <section className="content-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                <button className={statusFilter === 'all' ? 'tab active' : 'tab'} onClick={() => setStatusFilter('all')}>Todos</button>
                <button className={statusFilter === 'em_dia' ? 'tab active' : 'tab'} onClick={() => setStatusFilter('em_dia')}>Em dia</button>
                <button className={statusFilter === 'proximo_vencimento' ? 'tab active' : 'tab'} onClick={() => setStatusFilter('proximo_vencimento')}>Próximo venc.</button>
                <button className={statusFilter === 'vencido' ? 'tab active' : 'tab'} onClick={() => setStatusFilter('vencido')}>Vencidos</button>
              </div>
            </section>

            <section className="panel table-panel documents-only">
              <div className="panel-header">
                <h3>Lista completa de documentos</h3>
                <span className="panel-counter">{filteredDocuments.length} de {documents.length}</span>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="empty-state">Nenhum documento encontrado.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Tipo</th>
                      <th>Condomínio</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>{document.title}</td>
                        <td>{formatDocumentValue(document.documentType, DOCUMENT_TYPE_LABELS)}</td>
                        <td>{condominiums.find((item) => item.id === Number(document.condominiumId))?.name || 'N/D'}</td>
                        <td>{document.expirationDate || 'Sem data'}</td>
                        <td>
                          <span className={`badge ${document.status}`}>{formatDocumentValue(document.status, STATUS_LABELS)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
