import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/AdminLogin.css';


const AdminLogin = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      if (userName == "admin" && password == "admin22fb1") {
        alert("Giriş başarılı, yönlendiriliyorsunuz.");
        navigate("/Admin");
      }
    } catch (error) {
      console.error(error);
      alert('Giriş hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (

        <div className='container text-center adminlogin-background'>
            <h2 className='adminloginh2'>Admin Girişi</h2>
            <input
              type="text"
              value={userName}
              className="input"
              placeholder="Kullanıcı Adı"
              onChange={(e) => setUserName(e.target.value)}
            />
            <input
              type="text"
              value={password}
              className="input"
              placeholder="Şifre"
              onChange={(e) => setPassword(e.target.value)}
            />

            {loading ? (
              <div className="loader">Yükleniyor...</div>
            ) : (
              <button className="login-button" onClick={signIn}>
                Giriş Yap
              </button>
            )}
            </div>
  );
};

export default AdminLogin;
