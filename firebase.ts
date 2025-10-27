// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKF2fJIcnTuX1tmdemS-qs21FenAHPkNs",
  authDomain: "unnoorca.firebaseapp.com",
  projectId: "unnoorca",
  storageBucket: "unnoorca.firebasestorage.app",
  messagingSenderId: "552320095943",
  appId: "1:552320095943:web:cff8aa40c95ef9a886d0e2",
  measurementId: "G-3QRRQH98G5"
};

              // Initialize Firebase
              const app = initializeApp(firebaseConfig);
              const auth = getAuth(app);
              const db = getFirestore(app);
              const functions = getFunctions(app);


              export { app, auth, db, functions };