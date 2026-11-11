import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC4eUC10DiYSAbd_ktuZ1XQIYS1xPz2SiM",
  authDomain: "team-life-1d28c.firebaseapp.com",
  projectId: "team-life-1d28c",
  storageBucket: "team-life-1d28c.firebasestorage.app",
  messagingSenderId: "61252498580",
  appId: "1:61252498580:web:4175e4eeb13de49613b081",
  measurementId: "G-Q4ZMZFMQG7"
};

let app: firebase.app.App;
if (!firebase.apps.length) {
  try {
    app = firebase.initializeApp(firebaseConfig);
  } catch (error) {
    console.warn("Firebase initialization notice:", error);
    app = firebase.app();
  }
} else {
  app = firebase.app();
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export { firebase };

