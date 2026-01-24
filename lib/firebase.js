// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// BURADAKİ BİLGİLERİ KENDİ FİREBASE KONSOLUNDAN ALIP YAPIŞTIR
const firebaseConfig = {
   apiKey: "AIzaSyA5Kyq1R4CIuP-xbMiz-uNQ0A715TvI4Fg",
  authDomain: "interaktif-dijital-afis.firebaseapp.com",
  projectId: "interaktif-dijital-afis",
  storageBucket: "interaktif-dijital-afis.firebasestorage.app",
  messagingSenderId: "194257897761",
  appId: "1:194257897761:web:359de95fc3bd3e6cdf9660",
  measurementId: "G-5R316GC06J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);