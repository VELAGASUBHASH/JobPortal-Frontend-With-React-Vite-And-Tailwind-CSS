import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from "./Context/AuthContext.jsx";


import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import UserDashboard from "./Pages/UserDashBoard";
import AdminDashboard from "./Pages/AdminDashBoard";
import AboutUs from "./Pages/AboutUs.jsx";
import ContactUs from "./Pages/ContactUs.jsx";


const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;

    return children;
};

function App() {
    return (

        <AuthProvider>
            <div className="min-h-screen bg-[#07080f] font-sans text-white">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />



                    <Route path="/dashboard" element={
                        <ProtectedRoute allowedRole="USER">
                            <UserDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin" element={
                        <ProtectedRoute allowedRole="ADMIN">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>


                <Toaster position="bottom-right" />
            </div>
        </AuthProvider>
    );
}

export default App;