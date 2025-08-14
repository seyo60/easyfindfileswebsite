import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
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
    const [isAdmin, setIsAdmin] = useState(false);
    // Kaldırıldı: const [pendingUsers, setPendingUsers] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
            if (user) {
                const userDocRef = doc(FIRESTORE_DB, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setIsAdmin(true);
                    // Kaldırıldı: fetchPendingUsers();
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

    // Kaldırıldı: fetchPendingUsers fonksiyonu

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