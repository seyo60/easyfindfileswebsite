import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AdminRoute from './components/AdminRoute.js';
import UserRoute from './components/UserRoute.js';

// Lazy loaded components
const SignUp = lazy(() => import('./SignUp.jsx'));
const SignIn = lazy(() => import('./SignIn.jsx'));
const UserVerification = lazy(() => import('./UserVerification.jsx'));
const Home = lazy(() => import('./Home.jsx'));
const AdminLogin = lazy(() => import('./AdminLogin.jsx'));
const FileUpload = lazy(() => import('./FileUpload.jsx'));
const Admin = lazy(() => import('./Admin.jsx'));
const ForgetPassword = lazy(() => import('./ForgetPassword.jsx'));
const SignInHome = lazy(() => import('./SignInHome.jsx'));

const App = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/SignIn" replace />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/AdminLogin" element={<AdminLogin />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />

        {/* User Protected Routes */}
        <Route path="/Home" element={<UserRoute><Home /></UserRoute>} />
        <Route path="/SignInHome" element={<UserRoute><SignInHome /></UserRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/Admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/UserVerification" element={<AdminRoute><UserVerification /></AdminRoute>} />
        <Route path="/FileUpload" element={<AdminRoute><FileUpload /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/SignIn" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
