import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const signIn = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setError('');

        try {
            // Kullanıcı giriş yaptığında user değişkenini kullanmıyoruz, bu yüzden doğrudan await ediyoruz
            await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
            
            // Giriş başarılıysa admin paneline yönlendir
            navigate("/Admin");

        } catch (error) {
            console.error('Giriş hatası:', error);
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