import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CadastroAluno from "./CadastroAluno";

const Dashboard = ({ onLogout }) => {
    const [alunos, setAlunos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCadastro, setShowCadastro] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAlunos();
    }, []);

    const fetchAlunos = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                onLogout();
                return;
            }

            const response = await fetch("http://127.0.0.1:8000/alunos/", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAlunos(data);
            } else if (response.status === 401) {
                // Token inválido ou expirado
                onLogout();
                navigate("/");
            } else {
                setError("Erro ao carregar dados");
            }
        } catch (error) {
            setError("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        onLogout();
        navigate("/");
    };

    const toggleCadastro = () => {
        setShowCadastro(!showCadastro);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Dashboard</h1>
                <div>
                    <button 
                        className="btn btn-primary me-2" 
                        onClick={toggleCadastro}
                    >
                        {showCadastro ? "Voltar para Lista" : "Novo Aluno"}
                    </button>
                    <button className="btn btn-outline-danger" onClick={handleLogout}>
                        Sair
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {showCadastro ? (
                <CadastroAluno />
            ) : (
                <div className="card shadow">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Lista de Alunos</h5>
                    </div>
                    <div className="card-body">
                        {alunos.length === 0 ? (
                            <p className="text-center">Nenhum aluno cadastrado</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                            <th>Forma de Pagamento</th>
                                            <th>Fim do Plano</th>
                                            <th>Data de Matrícula</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alunos.map((aluno) => (
                                            <tr key={aluno.id}>
                                                <td>{aluno.id}</td>
                                                <td>{aluno.nome}</td>
                                                <td>{aluno.contato}</td>
                                                <td>{aluno.telefone || "-"}</td>
                                                <td>{aluno.forma_pagamento || "-"}</td>
                                                <td>{formatDate(aluno.fim_plano)}</td>
                                                <td>{formatDate(aluno.data_matricula)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info me-2">
                                                        Detalhes
                                                    </button>
                                                    <button className="btn btn-sm btn-success">
                                                        Pagamento
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;