import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase Authentication metodunu ekledik
import { FIREBASE_AUTH } from './firebase'; // Firebase auth objesini ekledik
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState(''); // userName yerine email kullanıyoruz
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const signIn = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setError('');

        try {
            // Firebase Authentication ile giriş yap
            const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
            const user = userCredential.user;

            // Giriş başarılıysa, admin yetki kontrolü Admin.jsx'te yapılacak
            // Bu yüzden doğrudan admin paneline yönlendiriyoruz.
            navigate("/Admin");

        } catch (error) {
            console.error('Giriş hatası:', error);
            // Firebase hata kodlarını kullanarak kullanıcıya özel hata mesajı göster
            if (error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                setError('Geçersiz e-posta veya şifre.');
            } else {
                setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='container text-center adminlogin-background'>
            <h2 className='adminloginh2'>Admin Girişi</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={signIn}>
                <div className="mb-3">
                    <input
                        type="email"
                        value={email}
                        className="form-control input"
                        placeholder="E-posta Adresi"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="mb-3">
                    <input
                        type="password"
                        value={password}
                        className="form-control input"
                        placeholder="Şifre"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {loading ? (
                    <div className="loader">Yükleniyor...</div>
                ) : (
                    <button 
                        type="submit" 
                        className="btn btn-primary login-button"
                        disabled={loading}
                    >
                        Giriş Yap
                    </button>
                )}
            </form>
        </div>
    );
};

export default AdminLogin;