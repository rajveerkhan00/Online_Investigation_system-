import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApADLxFbsmoQoexw6_TPyqpoa2X5G6RJA",
  authDomain: "app-3009b.firebaseapp.com",
  projectId: "app-3009b",
  storageBucket: "app-3009b.appspot.com",
  messagingSenderId: "362518880069",
  appId: "1:362518880069:web:19cb9e4bf79a8f232da82c",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); 
export default app;
