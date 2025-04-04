import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Verificar se o usuário já está autenticado ao carregar a aplicação
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    // Função para atualizar o estado de autenticação após login
    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    // Função para deslogar
    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={
                        isAuthenticated ? 
                        <Navigate to="/dashboard" /> : 
                        <Login onLogin={handleLogin} />
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        isAuthenticated ? 
                        <Dashboard onLogout={handleLogout} /> : 
                        <Navigate to="/" />
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;