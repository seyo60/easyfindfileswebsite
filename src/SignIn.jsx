import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { useNavigate } from 'react-router-dom';
import './css/SignIn.css';


const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      console.log(response);

      if (verificationCode) {
        alert("Giriş başarılı, yönlendiriliyorsunuz.");
        navigate("/Home");
      }
    } catch (error) {
      console.error(error);
      alert('Giriş hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const SignUpNavigate = () =>{
    navigate('/SignUp')
  }

 const ForgetPasswordNavigate = () =>{
    navigate('/ForgetPassword')
  }

  return (
    <div className="container">
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
      <input
        type="text"
        value={verificationCode}
        className="input"
        placeholder="Doğrulama Kodu"
        onChange={(e) => setVerificationCode(e.target.value)}
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
      

      
        <button className="sign-up" onClick={SignUpNavigate}>
          Kayıt Ol
        </button>
      
    </div>
  );
};

export default SignIn;
