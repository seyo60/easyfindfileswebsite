import React, { useState } from 'react';
import { FIREBASE_AUTH } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './css/ForgetPassword.css';

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Lütfen email adresinizi giriniz');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      setMessage('Şifre sıfırlama bağlantısı email adresinize gönderildi!');
      setTimeout(() => navigate("/SignIn"), 3000);
    } catch (error) {
      console.error(error);
      let errorMessage = 'Bir hata oluştu';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Bu email adresiyle kayıtlı kullanıcı bulunamadı';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi';
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Şifremi Unuttum</h2>
      <p>Email adresinizi girerek şifre sıfırlama bağlantısı alabilirsiniz</p>
      
      <input
        type="email"
        value={email}
        className="input"
        placeholder="Email adresiniz"
        onChange={(e) => setEmail(e.target.value)}
      />

      {message && <div className="message">{message}</div>}

      {loading ? (
        <div className="loader">Yükleniyor...</div>
      ) : (
        <button 
          className="forget-password" 
          onClick={handleResetPassword}
          disabled={!email}
        >
          Şifremi Sıfırla
        </button>
      )}
    </div>
  );
};

export default ForgetPassword;