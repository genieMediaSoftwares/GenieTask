// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getStorage } from "firebase/storage";
// import { getDatabase } from "firebase/database";


// const firebaseConfig = {
//   apiKey: "AIzaSyCGyPIBwYKcU2yxf3lkkk_v8OiPYbToLAk",
//   authDomain: "genietask-59576.firebaseapp.com",
//   projectId: "genietask-59576",
//   storageBucket: "genietask-59576.firebasestorage.app",
//   messagingSenderId: "114128784454",
//   appId: "1:114128784454:web:6e705a1b60b8620da74e47",
// };

// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const storage = getStorage(app);
// export const db = getDatabase(app);




import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // ✅ REQUIRED
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);