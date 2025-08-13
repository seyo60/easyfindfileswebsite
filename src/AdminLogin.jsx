import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const signIn = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setError('');

        try {
            // Giriş bilgilerini kontrol et
            if (userName === "admin" && password === "admin22fb1") {
                // LocalStorage'a admin durumunu kaydet
                localStorage.setItem('isAdmin', 'true');
                
                // Yönlendirme yap
                navigate("/Admin");
            } else {
                setError('Hatalı kullanıcı adı veya şifre!');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
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
                        type="text"
                        value={userName}
                        className="form-control input"
                        placeholder="Kullanıcı Adı"
                        onChange={(e) => setUserName(e.target.value)}
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