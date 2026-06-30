import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUdue23D-FLH9sb2IRAY7QDLEdltQfLww",
  authDomain: "diticoms-service.firebaseapp.com",
  projectId: "diticoms-service",
  storageBucket: "diticoms-service.firebasestorage.app",
  messagingSenderId: "678527445603",
  appId: "1:678527445603:web:c1b555937baf89ff536656",
  measurementId: "G-451JQ25GTS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
