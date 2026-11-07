// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3RDTz31qLvuJL3KbO-bYlGyEnDwRM32w",
  authDomain: "panay-cycling-community.firebaseapp.com",
  databaseURL: "https://panay-cycling-community-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "panay-cycling-community",
  storageBucket: "panay-cycling-community.firebasestorage.app",
  messagingSenderId: "538243685704",
  appId: "1:538243685704:web:08716e6646aaca8b9aa77d",
  measurementId: "G-XW1K26C8G2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
