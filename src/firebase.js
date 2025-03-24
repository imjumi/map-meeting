// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 너가 복사한 firebaseConfig로 바꿔줘!
const firebaseConfig = {
    apiKey: "AIzaSyBUhsr93p21ec87MlcQ_jB4x15RHAF5Z54",
    authDomain: "map-meeting-7e2fe.firebaseapp.com",
    projectId: "map-meeting-7e2fe",
    storageBucket: "map-meeting-7e2fe.firebasestorage.app",
    messagingSenderId: "996036052869",
    appId: "1:996036052869:web:0689ceb2d36e927b77e6ec"
  };
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };