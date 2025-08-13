import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import emailjs from 'emailjs-com';
import SignUp from './SignUp.jsx';
import './css/UserVerification.css';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import './css/UserVerification.css';

const UserVerification = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // *** Korumalı rota mekanizması burasıdır ***
    useEffect(() => {
        // localStorage'daki 'isAdmin' durumunu kontrol et
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        // Eğer admin yetkisi yoksa, giriş sayfasına yönlendir
        if (!isAdmin) {
            navigate("/AdminLogin");
        } else {
            // Admin yetkisi varsa, onay bekleyen kullanıcıları getir
            fetchPendingUsers();
        }
    }, [navigate]); // navigate bağımlılığı ile çalışması için eklenir

    const fetchPendingUsers = async () => {
        try {
            const q = query(collection(FIRESTORE_DB, "users"), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            setPendingUsers(users); 
        } catch (error) {
            console.error("Kullanıcılar alınırken hata:", error);
            setMessage("Kullanıcılar alınırken hata oluştu");
        } finally {
            setLoading(false); 
        }
    };

    const verificationUser = async (userId, userEmail) => {
        try {
            setLoading(true);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            const templateParams = {
                to_email: userEmail,
                verificationCode: verificationCode,
            };

            const emailResponse = await emailjs.send(
                'service_1xtxpso', 
                'template_euxr4qa',
                templateParams,
                '-7Ex3SjAKOjd_fA6n'
            );

            if (emailResponse.status === 200) {
                await updateDoc(doc(FIRESTORE_DB, "users", userId), {
                    status: 'approved',
                    verificationCode: verificationCode,
                });

                setPendingUsers(pendingUsers.filter(user => user.id !== userId));
                setMessage('Kullanıcı onaylandı ve doğrulama e-postası gönderildi');
            } else {
                throw new Error('E-posta gönderilemedi');
            }
        } catch (error) {
            console.error("Onaylama hatası:", error);
            
            if (error.text) {
                setMessage(`EmailJS Hatası: ${error.text}`);
            } 
            else if (error.message) {
                setMessage(`Firestore Hatası: ${error.message}`);
            }
            else {
                setMessage(`Beklenmeyen Hata: ${JSON.stringify(error)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const NavigateFiles = () =>{
        navigate('/Admin');
    }

    return (
        <div className="admin-container">
            <h2>Onay Bekleyen Kullanıcılar</h2>
            {message && <div className="message">{message}</div>}
            <div className='container3 text-center'> 
                <div className="user-list">
                    {pendingUsers.length === 0 ? (
                        <p>Onay bekleyen kullanıcı bulunmamaktadır</p>
                    ) : (
                        <table className='onayTablosu'>
                            <thead>
                                <tr>
                                    <th>Ad Soyad</th>
                                    <th>E-posta</th>
                                    <th>Bölüm</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name} {user.surname}</td>
                                        <td>{user.email}</td>
                                        <td>{user.department}</td>
                                        <td>
                                            <button 
                                                onClick={() => verificationUser(user.id, user.email)}
                                                className="approve-btn"
                                            >
                                                Onayla
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <Button variant="danger" className='admin-buttons' onClick={NavigateFiles}>Geri Dön</Button>
        </div>
    );
};

export default UserVerification;