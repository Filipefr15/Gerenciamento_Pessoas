import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
    const [alunos, setAlunos] = useState([]);
    const [nome, setNome] = useState("");
    const [contato, setContato] = useState("");
    
    useEffect(() => {
        fetch("http://127.0.0.1:8000/alunos/")
            .then(response => response.json())
            .then(data => setAlunos(data))
            .catch(error => console.error("Erro ao buscar alunos:", error));
    }, []);

    const cadastrarAluno = async () => {
        const response = await fetch("http://127.0.0.1:8000/alunos/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, contato })
        });

        if (response.ok) {
            const novoAluno = await response.json();
            setAlunos([...alunos, novoAluno]);
            setNome("");
            setContato("");
        } else {
            alert("Erro ao cadastrar aluno");
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Gerenciamento de Alunos</h2>
            
            <div className="card p-3 mb-4">
                <h5>Adicionar Aluno</h5>
                <div className="row">
                    <div className="col-md-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nome"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Contato"
                            value={contato}
                            onChange={e => setContato(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-primary w-100" onClick={cadastrarAluno}>Cadastrar</button>
                    </div>
                </div>
            </div>

            <table className="table table-bordered table-striped">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Contato</th>
                        <th>Data de Matrícula</th>
                    </tr>
                </thead>
                <tbody>
                    {alunos.map(aluno => (
                        <tr key={aluno.id}>
                            <td>{aluno.id}</td>
                            <td>{aluno.nome}</td>
                            <td>{aluno.contato}</td>
                            <td>{new Date(aluno.data_matricula).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
