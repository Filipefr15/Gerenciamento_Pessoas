import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CadastroAluno = () => {
  const [formData, setFormData] = useState({
    nome: "",
    contato: "",
    telefone: "",
    forma_pagamento: "Cartão de Crédito",
    data_matricula: new Date().toISOString().split("T")[0],
    fim_plano: "",
    valor_mensalidade: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/alunos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          nome: "",
          contato: "",
          telefone: "",
          forma_pagamento: "Cartão de Crédito",
          fim_plano: ""
        });
        setTimeout(() => setSuccess(false), 3000);
      } else if (response.status === 401) {
        navigate("/");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Erro ao cadastrar aluno");
      }
    } catch (error) {
      setError("Erro de conexão ao servidor");
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="card shadow">
        <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Cadastro de Novo Aluno</h5>
        </div>
        <div className="card-body">
            {success && (
                <div className="alert alert-success" role="alert">
                    Aluno cadastrado com sucesso!
                </div>
            )}
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="nome" className="form-label">Nome completo</label>
                    <input
                        type="text"
                        className="form-control"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="contato" className="form-label">E-mail</label>
                        <input
                            type="email"
                            className="form-control"
                            id="contato"
                            name="contato"
                            value={formData.contato}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="col-md-6">
                        <label htmlFor="telefone" className="form-label">Telefone</label>
                        <input
                            type="tel"
                            className="form-control"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>
                
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="forma_pagamento" className="form-label">Forma de Pagamento</label>
                        <select
                            className="form-select"
                            id="forma_pagamento"
                            name="forma_pagamento"
                            value={formData.forma_pagamento}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Cartão de Débito">Cartão de Débito</option>
                            <option value="Boleto">Boleto</option>
                            <option value="Pix">Pix</option>
                            <option value="Dinheiro">Dinheiro</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="data_matricula" className="form-label">Data de Matrícula</label>
                        <input
                            type="date"
                            className="form-control"
                            id="data_matricula"
                            name="data_matricula"
                            value={formData.data_matricula}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="fim_plano" className="form-label">Fim do Plano</label>
                        <input
                            type="date"
                            className="form-control"
                            id="fim_plano"
                            name="fim_plano"
                            value={formData.fim_plano}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="valor_mensalidade" className="form-label">Valor Mensalidade</label>
                        <input
                            type="integer"
                            className="form-control"
                            id="valor_mensalidade"
                            name="valor_mensalidade"
                            value={formData.valor_mensalidade}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>
                </div>
                
                <div className="d-flex justify-content-end mt-4">
                    <button 
                        type="button" 
                        className="btn btn-secondary me-2"
                        onClick={() => navigate("/dashboard")}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isLoading || new Date(formData.fim_plano) < new Date()}
                    >
                        {isLoading ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Cadastrando...
                            </span>
                        ) : (
                            "Cadastrar Aluno"
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
);
};

export default CadastroAluno;