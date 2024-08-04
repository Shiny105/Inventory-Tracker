// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEG3HMuzA4wkgsdQIjJnPZO1hwIbdui_c",
  authDomain: "inventory-management-28b06.firebaseapp.com",
  projectId: "inventory-management-28b06",
  storageBucket: "inventory-management-28b06.appspot.com",
  messagingSenderId: "564732892620",
  appId: "1:564732892620:web:cca610c5839e17eba9b969",
  measurementId: "G-PD8VC2L7V8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { firestore };