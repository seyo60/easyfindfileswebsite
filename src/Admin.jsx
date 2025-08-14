import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './css/Admin.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

const Admin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingUsers, setPendingUsers] = useState([]); // Eksik state eklendi

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
            if (user) {
                const userDocRef = doc(FIRESTORE_DB, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setIsAdmin(true);
                    fetchPendingUsers();
                } else {
                    setIsAdmin(false);
                    navigate("/AdminLogin");
                }
            } else {
                setIsAdmin(false);
                navigate("/AdminLogin");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchPendingUsers = async () => {
        setLoading(true);
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

    const NavigateFiles = () => {
        navigate("/FileUpload");
    }

    const NavigateVerification = () => {
        navigate("/UserVerification");
    }

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            navigate("/AdminLogin");
        } catch (error) {
            console.error("Çıkış yaparken hata oluştu:", error);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

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