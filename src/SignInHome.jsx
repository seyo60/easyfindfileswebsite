import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from './firebase';
import { useNavigate } from 'react-router-dom';
import './css/SignInHome.css';


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

export default SignIn;
