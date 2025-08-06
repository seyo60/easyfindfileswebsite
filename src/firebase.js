// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZB5hruj-AooCP257-ExWDHZSCOPwDQtI",
  authDomain: "stajprojesifirebase.firebaseapp.com",
  projectId: "stajprojesifirebase",
  storageBucket: "stajprojesifirebase.firebasestorage.app",
  messagingSenderId: "855125738226",
  appId: "1:855125738226:web:b7cc896cb20142a9db466b",
  measurementId: "G-YRVFHEESXK"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const storage = getStorage(FIREBASE_APP);