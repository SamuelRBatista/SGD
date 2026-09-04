import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { PieChart, LineChart } from './ChartComponent';
import DocumentList from './components/DocumentList';
import Login from './components/Login';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const [view, setView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingDocuments, setUpcomingDocuments] = useState([]);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const token = localStorage.getItem('sgld_token');
    if (!token) return;

    try {
      const [documentsRes, buildingsRes, condominiumsRes, upcomingRes] = await Promise.all([
        fetch(`${API_URL}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/buildings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/condominiums`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/dashboard/upcoming`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const documentsData = await documentsRes.json();
      const buildingsData = await buildingsRes.json();
      const condominiumsData = await condominiumsRes.json();
      const upcomingData = await upcomingRes.json();

      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      setCondominiums(Array.isArray(condominiumsData) ? condominiumsData : []);
      setUpcomingDocuments(Array.isArray(upcomingData) ? upcomingData : []);
      
      setAuth({ 
        token, 
        user: JSON.parse(localStorage.getItem('sgld_user') || 'null') 
      });

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
      const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.issuingBody?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [documents, statusFilter, searchTerm]);

  const handleAuthenticated = ({ token, user }) => {
    localStorage.setItem('sgld_token', token);
    localStorage.setItem('sgld_user', JSON.stringify(user));
    setAuth({ token, user });
    loadData();
  };

  // =============== FUNÇÕES DE DOCUMENTOS ===============
  // ⚠️ Função handleSubmit pode ser removida (não usada mais)
  // Mantida apenas para compatibilidade
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

  // =============== NOVAS FUNÇÕES PARA CRUD ===============
  const handleDocumentAdded = () => {
    loadData();
    // Opcional: manter na view documents
    setView('documents');
  };

  const handleDocumentUpdated = () => {
    loadData();
    // Mantém na view documents
    setView('documents');
  };

  const handleDocumentDeleted = () => {
    loadData();
    // Mantém na view documents
    setView('documents');
  };

  // =============== FUNÇÕES DE CONDOMÍNIOS E BLOCOS ===============
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

  // =============== HANDLERS DE CHANGE ===============
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

  // =============== LOGOUT ===============
  const handleLogout = () => {
    localStorage.removeItem('sgld_token');
    localStorage.removeItem('sgld_user');
    setAuth({ token: '', user: null });
    setView('login');
  };

  // =============== TELA DE LOGIN ===============
  if (!auth.user) {
    return <Login onAuthenticated={handleAuthenticated} />;
  }

  // =============== APP PRINCIPAL ===============
  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <p className="eyebrow">SGLD</p>
          <h1>Gestão documental</h1>
        </div>
        <nav>
          <span 
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </span>
          <span 
            className={`nav-item ${view === 'condominiums' ? 'active' : ''}`} 
            onClick={() => setView('condominiums')}
          >
            Condomínios
          </span>
          <span 
            className={`nav-item ${view === 'buildings' ? 'active' : ''}`} 
            onClick={() => setView('buildings')}
          >
            Blocos
          </span>
          <span 
            className={`nav-item ${view === 'documents' ? 'active' : ''}`} 
            onClick={() => setView('documents')}
          >
            Documentos
          </span>
          <span className="nav-item" onClick={handleLogout}>Sair</span>
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel do síndico</p>
            <h2>
              {view === 'dashboard' && 'Análise de documentos'}
              {view === 'condominiums' && 'Gerenciar condomínios'}
              {view === 'buildings' && 'Gerenciar blocos'}
              {view === 'documents' && 'Documentos'}
            </h2>
          </div>
          <div className="user-badge">{auth.user?.name || 'Usuário'}</div>
        </header>

        {/* ==================== DASHBOARD ==================== */}
        {view === 'dashboard' && (
          <>
            {/* Métricas */}
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

            {/* Gráficos */}
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

            {/* ⚠️ FORMULÁRIO REMOVIDO DAQUI ⚠️ */}
          </>
        )}

        {/* ==================== CONDOMÍNIOS ==================== */}
        {view === 'condominiums' && (
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
        )}

        {/* ==================== BLOCOS ==================== */}
        {view === 'buildings' && (
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
        )}

        {/* ==================== DOCUMENTOS ==================== */}
        {view === 'documents' && (
          <DocumentList
            documents={documents}
            condominiums={condominiums}
            buildings={buildings}
            onDocumentAdded={handleDocumentAdded}
            onDocumentUpdated={handleDocumentUpdated}
            onDocumentDeleted={handleDocumentDeleted}
            onRefresh={loadData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
