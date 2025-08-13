import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { useNavigate } from 'react-router-dom';
import './css/SignInHome.css';
import { useAuth } from './context/AuthContext.js'; 
import { doc, getDoc } from 'firebase/firestore';   


const SignInHome = () => {
  const { setCurrentUser, setIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      
      // AuthContext'i güncelle
      setCurrentUser(user);
      
      // Firestore'dan admin bilgisini çek
      const userDoc = await getDoc(doc(FIRESTORE_DB, "users", user.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data().isAdmin || false);
      }

      navigate("/Home");
      
    } catch (error) {
      console.error('Giriş hatası:', error);
      alert(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }

 const ForgetPasswordNavigate = () =>{
    navigate('/ForgetPassword')
  }

  return (
    <div className="container sign_in_home">
      <input
        type="email"
        value={email}
        className="input"
        placeholder="E-Posta"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        className="input"
        placeholder="Şifre"
        onChange={(e) => setPassword(e.target.value)}
      />

      {loading ? (
        <div className="loader">Yükleniyor...</div>
      ) : (
        <button className="login-button2" onClick={signIn}>
          Giriş Yap
        </button>
      )}

      
        <button className="forget-password" onClick={ForgetPasswordNavigate}>
          Şifremi Unuttum
        </button>
    </div>
  );
};
}
export default SignInHome;
