import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9NOd8qHJbr3cyHVzlLys-4bVW_2sPoTs",
  authDomain: "timely-449b3.firebaseapp.com",
  projectId: "timely-449b3",
  storageBucket: "timely-449b3.appspot.com",
  messagingSenderId: "295682488833",
  appId: "1:295682488833:web:808510261d9e7564ad9e00",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
