import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

const UserRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/SignIn" replace />;
  }

  return children;
};

export default UserRoute;
