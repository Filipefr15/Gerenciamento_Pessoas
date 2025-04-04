import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch("http://127.0.0.1:8000/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.access_token);
                onLogin(); // Atualiza o estado de autenticação no App
                navigate("/dashboard"); // Redireciona para o dashboard
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Falha no login. Verifique suas credenciais.");
            }
        } catch (error) {
            setError("Erro de conexão. Verifique se o servidor está ativo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
                <h3 className="text-center text-primary mb-4">Login</h3>
                
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                </div>
                <button 
                    className="btn btn-primary w-100" 
                    onClick={handleLogin} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Entrando...
                        </span>
                    ) : (
                        "Entrar"
                    )}
                </button>
            </div>
        </div>
    );
};

export default Login;