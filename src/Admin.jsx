import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import SignUp from './SignUp.jsx';
import './css/Admin.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';


const Admin = () => {
    const navigate = useNavigate();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [message, setMessage] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
            if (user) {
                // Kullanıcı oturum açmışsa, Firestore'dan admin durumunu kontrol et
                const userDocRef = doc(FIRESTORE_DB, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setIsAdmin(true);
                    fetchPendingUsers();
                } else {
                    // Kullanıcı admin değilse giriş sayfasına yönlendir
                    setIsAdmin(false);
                    navigate("/AdminLogin");
                }
            } else {
                // Kullanıcı oturum açmamışsa giriş sayfasına yönlendir
                setIsAdmin(false);
                navigate("/AdminLogin");
            }
            setLoading(false);
        });

        // Temizleme fonksiyonu: component unmount olduğunda dinleyiciyi durdurur
        return () => unsubscribe();
    }, [navigate]);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            // Sadece 'pending' durumundaki kullanıcıları çekmek için Firestore sorgusu
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

    const NavigateFiles = () => {
        navigate("/FileUpload");
    }

    const NavigateVerification = () => {
        navigate("/UserVerification");
    }

    const handleLogout = async () => {
        // Firebase Authentication üzerinden güvenli çıkış yap
        try {
            await FIREBASE_AUTH.signOut();
            navigate("/AdminLogin");
        } catch (error) {
            console.error("Çıkış yaparken hata oluştu:", error);
        }
    }

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
            } else if (error.message) {
                setMessage(`Firestore Hatası: ${error.message}`);
            } else {
                setMessage(`Beklenmeyen Hata: ${JSON.stringify(error)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    // Admin yetkisi yoksa, bu kısım gösterilmez
    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container text-center admin-background">
            <h2 className='adminh2'>Seçim Yap</h2>
            {message && <div className="message">{message}</div>}

            <Container className='container2'>
                <Row>
                    <Col>     
                        <div>
                            <Button variant="success" className='admin-buttons' onClick={NavigateVerification}>Kullanıcı Onaylama</Button>
                            <Button variant="success" className='admin-buttons' onClick={NavigateFiles}>Dosya Yükleme</Button>
                            <Button variant="danger" className='admin-buttons' onClick={handleLogout}>Çıkış Yap</Button>             
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Admin;