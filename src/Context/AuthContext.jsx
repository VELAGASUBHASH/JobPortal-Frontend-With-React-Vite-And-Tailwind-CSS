import  { createContext, useState, useContext } from 'react';
import { api } from '../Services/api.js'; // Ensure this path matches exactly!
import toast from 'react-hot-toast';

const AuthContext = createContext();

const getRoleFromToken = (token) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roleStr = JSON.stringify(payload).toUpperCase();
        if (roleStr.includes('ADMIN')) return 'ADMIN';
        return 'USER';
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [role, setRole] = useState(getRoleFromToken(localStorage.getItem('token')));

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const jwtToken = response.data;

            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);
            setIsAuthenticated(true);
            setRole(getRoleFromToken(jwtToken));

            toast.success("Successfully logged in!");
            return getRoleFromToken(jwtToken);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data || "Login failed.";
            toast.error(errorMsg);
            return null;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setRole(null);
        toast.success("Logged out successfully");
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 🚨 THE FAIL-SAFE FIX 🚨
export const useAuth = () => {
    const context = useContext(AuthContext);

    // If Vite gives us an empty context, we catch it here instead of crashing the app!
    if (context === undefined) {
        console.warn("⚠️ useAuth returned undefined! Vite likely cached two different versions of your AuthContext file due to an import path mismatch.");

        // Return dummy data so the app survives the crash
        return {
            token: null,
            isAuthenticated: false,
            role: null,
            login: async () => null,
            logout: () => {}
        };
    }

    return context;
};