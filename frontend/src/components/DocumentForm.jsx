// src/components/DocumentForm.jsx
import { useState, useRef, useEffect } from 'react';

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

function DocumentForm({ 
  condominiums = [], 
  buildings = [], 
  onSave, 
  onCancel,
  initialData = null,
  isEditing = false 
}) {
  const [form, setForm] = useState(initialData || emptyForm);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Atualizar form quando initialData mudar (para edição)
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('sgld_token');
    
    // Se for edição, usa PUT, senão POST
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `${API_URL}/documents/${form.id}` 
      : `${API_URL}/documents`;

    try {
      let response;
      
      if (isEditing) {
        // Para edição, enviar como JSON (não FormData, a menos que tenha arquivo)
        const hasFile = fileInputRef.current?.files[0];
        
        if (hasFile) {
          const formData = new FormData();
          Object.keys(form).forEach((key) => {
            formData.append(key, form[key]);
          });
          formData.append('file', fileInputRef.current.files[0]);
          
          response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } else {
          response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
          });
        }
      } else {
        // Para criação, usar FormData
        const formData = new FormData();
        Object.keys(form).forEach((key) => {
          formData.append(key, form[key]);
        });

        if (fileInputRef.current?.files[0]) {
          formData.append('file', fileInputRef.current.files[0]);
        }

        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (response.ok) {
        const data = await response.json();
        setForm(emptyForm);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Chamar callback com sucesso
        if (onSave) {
          onSave(data, isEditing);
        }
      } else {
        const error = await response.json();
        alert(error.message || `Erro ao ${isEditing ? 'atualizar' : 'salvar'} documento`);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-form-container">
      <div className="form-header">
        <h3>{isEditing ? 'Editar documento' : 'Adicionar novo documento'}</h3>
        {onCancel && (
          <button type="button" className="close-btn" onClick={onCancel}>
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="document-form-grid">
        {/* ID oculto para edição */}
        {isEditing && (
          <input type="hidden" name="id" value={form.id} />
        )}

        <div className="field-group">
          <label>
            Título *
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              placeholder="Ex.: Alvará de funcionamento"
              required
            />
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
            <input 
              name="issuingBody" 
              value={form.issuingBody} 
              onChange={handleChange} 
              placeholder="Prefeitura / empresa / consultoria"
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Condomínio *
            <select 
              name="condominiumId" 
              value={form.condominiumId} 
              onChange={handleChange}
              required
            >
              <option value="">Selecione um condomínio</option>
              {condominiums.map((condominium) => (
                <option key={condominium.id} value={condominium.id}>
                  {condominium.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-group">
          <label>
            Bloco
            <select name="buildingId" value={form.buildingId} onChange={handleChange}>
              <option value="">Selecione um bloco</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-group">
          <label>
            Data de emissão
            <input 
              type="date" 
              name="issueDate" 
              value={form.issueDate} 
              onChange={handleChange} 
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Data de vencimento *
            <input 
              type="date" 
              name="expirationDate" 
              value={form.expirationDate} 
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Responsável
            <input 
              name="responsible" 
              value={form.responsible} 
              onChange={handleChange} 
              placeholder="Nome da empresa ou responsável"
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Notificar antes de (dias)
            <input 
              type="number" 
              name="notificationDays" 
              value={form.notificationDays} 
              onChange={handleChange} 
              min="1"
              max="365"
            />
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

        <div className="field-group full-width">
          <label>
            Arquivo {isEditing && '(deixe em branco para manter o atual)'}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" 
            />
          </label>
        </div>

        <div className="form-actions full-width">
          {onCancel && (
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            className="primary-btn" 
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar documento'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DocumentForm;
