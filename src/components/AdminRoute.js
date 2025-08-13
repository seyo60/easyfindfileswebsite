import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { toast } from 'react-toastify';

const AdminRoute = ({ children }) => {
  const { isAdmin, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) {
    toast.warning('Admin erişimi için giriş yapmalısınız');
    return <Navigate to="/AdminLogin" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    toast.error('Bu sayfaya erişim yetkiniz yok');
    return <Navigate to="/Home" replace />;
  }

  return children;
};

export default AdminRoute;
