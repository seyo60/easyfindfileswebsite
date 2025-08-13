import { Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './SignUp';
import SignIn from './SignIn';
import UserVerification from './UserVerification';
import Home from './Home';
import AdminLogin from './AdminLogin';
import FileUpload from './FileUpload';
import Admin from './Admin';
import ForgetPassword from './ForgetPassword';
import SignInHome from './SignInHome';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/SignUp" replace />} />
      <Route path="/SignIn" element={<SignIn />} />
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/UserVerification" element={<UserVerification />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/AdminLogin" element={<AdminLogin />} />
      <Route path="/FileUpload" element={<FileUpload />} />
      <Route path="/Admin" element={<Admin />} />
      <Route path="/ForgetPassword" element={<ForgetPassword />} />
      <Route path="/SignInHome" element={<SignInHome />} />
    </Routes>
  );
};

export default App;
