// src/components/DocumentList.jsx
import { useState } from 'react';
import DocumentForm from './DocumentForm';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

function DocumentList({ 
  documents = [], 
  condominiums = [], 
  buildings = [],
  onDocumentAdded,
  onDocumentUpdated,
  onDocumentDeleted,
  onRefresh 
}) {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDocument, setEditingDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuingBody?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleFormSave = (data, wasEditing) => {
    setShowForm(false);
    setEditingDocument(null);
    setIsEditing(false);
    
    if (wasEditing) {
      if (onDocumentUpdated) onDocumentUpdated(data);
    } else {
      if (onDocumentAdded) onDocumentAdded(data);
    }
    
    // Recarregar dados
    if (onRefresh) onRefresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDocument(null);
    setIsEditing(false);
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (document) => {
    if (!confirm(`Deseja excluir o documento "${document.title}"?`)) {
      return;
    }

    const token = localStorage.getItem('sgld_token');
    setDeletingId(document.id);

    try {
      const response = await fetch(`${API_URL}/documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Documento excluído com sucesso!');
        if (onDocumentDeleted) onDocumentDeleted(document.id);
        if (onRefresh) onRefresh();
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao excluir documento');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddNew = () => {
    setEditingDocument(null);
    setIsEditing(false);
    setShowForm(true);
  };

  return (
    <div className="documents-container">
      {/* Cabeçalho com botão */}
      <div className="documents-header">
        <div className="header-left">
          <h2>Documentos</h2>
          <span className="document-count">{documents.length} documentos</span>
        </div>
        <button 
          className="primary-btn" 
          onClick={handleAddNew}
        >
          + Novo Documento
        </button>
      </div>

      {/* Formulário (condicional) */}
      {showForm && (
        <div className="form-overlay">
          <DocumentForm
            condominiums={condominiums}
            buildings={buildings}
            initialData={editingDocument}
            isEditing={isEditing}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="content-actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button 
            className={statusFilter === 'all' ? 'tab active' : 'tab'} 
            onClick={() => setStatusFilter('all')}
          >
            Todos
          </button>
          <button 
            className={statusFilter === 'em_dia' ? 'tab active' : 'tab'} 
            onClick={() => setStatusFilter('em_dia')}
          >
            Em dia
          </button>
          <button 
            className={statusFilter === 'proximo_vencimento' ? 'tab active' : 'tab'} 
            onClick={() => setStatusFilter('proximo_vencimento')}
          >
            Próximo venc.
          </button>
          <button 
            className={statusFilter === 'vencido' ? 'tab active' : 'tab'} 
            onClick={() => setStatusFilter('vencido')}
          >
            Vencidos
          </button>
        </div>
      </div>

      {/* Tabela de Documentos */}
      <div className="panel table-panel">
        <div className="panel-header">
          <h3>Lista de documentos</h3>
          <span className="panel-counter">
            {filteredDocuments.length} de {documents.length}
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="empty-state">
            {documents.length === 0 ? (
              <>
                <p>Nenhum documento cadastrado.</p>
                <button 
                  className="primary-btn" 
                  onClick={handleAddNew}
                  style={{ marginTop: '1rem' }}
                >
                  Adicionar primeiro documento
                </button>
              </>
            ) : (
              <p>Nenhum documento encontrado com os filtros atuais.</p>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Condomínio</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.title}</strong>
                    {document.responsible && (
                      <div className="doc-meta">{document.responsible}</div>
                    )}
                  </td>
                  <td>{formatDocumentValue(document.documentType, DOCUMENT_TYPE_LABELS)}</td>
                  <td>
                    {condominiums.find(
                      (item) => item.id === Number(document.condominiumId)
                    )?.name || 'N/D'}
                  </td>
                  <td>{document.expirationDate || 'Sem data'}</td>
                  <td>
                    <span className={`badge ${document.status}`}>
                      {formatDocumentValue(document.status, STATUS_LABELS)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(document)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(document)}
                      disabled={deletingId === document.id}
                      title="Excluir"
                    >
                      {deletingId === document.id ? '⏳' : '🗑️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DocumentList;
