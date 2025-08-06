import React, { useState } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/SignUp.css';


const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [departmentValue, setDepartmentValue] = useState(null);

  const signUp = async (e) => {
    e.preventDefault();

    if (!name || !surname || !email || !password || !departmentValue) {
      alert('Lütfen tüm alanları doldurunuz');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      await setDoc(doc(FIRESTORE_DB, "users", user.uid), {
        name,
        surname,
        email,
        department: departmentValue,
        status: 'pending',
        verificationCode: null,
        createdAt: new Date().toISOString(),
      });

      alert('Kayıt başarılı! Admin onayı bekleniyor.');

      navigate("/SignIn");

    } catch (error) {
      console.error('Kayıt hatası:', error);
      let errorMessage = 'Kayıt sırasında bir hata oluştu';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre en az 6 karakter olmalıdır';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={signUp}>
        <div>
          <label className='signup-name'>İsim</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Soyadı</label>
          <input
            type='text'
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>

<div className="mb-3">
  <label className="form-label">Bölüm seçiniz</label>
  <DropdownButton
    id="dropdown-basic-button"
    title={departmentValue || "Bölüm Seçiniz"}
    drop="down"
    className="w-100"
  >
    <Dropdown.Item onClick={() => setDepartmentValue('Finans')}>Finans</Dropdown.Item>
    <Dropdown.Item onClick={() => setDepartmentValue('AR-GE')}>AR-GE</Dropdown.Item>
    <Dropdown.Item onClick={() => setDepartmentValue('Yaratıcı Tasarım')}>Yaratıcı Tasarım</Dropdown.Item>
    <Dropdown.Item onClick={() => setDepartmentValue('Robotik')}>Robotik</Dropdown.Item>
  </DropdownButton>
</div>


        <div>
          <label>E-Posta</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Şifre</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type='submit' disabled={loading}>
          {loading ? 'Kayıt oluyor...' : 'Kayıt Ol'}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
