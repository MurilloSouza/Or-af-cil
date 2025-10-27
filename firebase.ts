// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYmEDSoZ5vFwRvQw-flqlEBM6g2CU6-yc",
  authDomain: "projeto-unno---orcamento.firebaseapp.com",
  projectId: "projeto-unno---orcamento",
  storageBucket: "projeto-unno---orcamento.firebasestorage.app",
  messagingSenderId: "505424819431",
  appId: "1:505424819431:web:3b9ab4831c73f2132b1e42",
  measurementId: "G-0LB76VSR6G"
};

              // Initialize Firebase
              const app = initializeApp(firebaseConfig);
              const auth = getAuth(app);
              const db = getFirestore(app);
              const functions = getFunctions(app);


              export { app, auth, db, functions };