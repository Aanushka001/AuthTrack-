// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\config\firebase.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://authtrack-8e888.firebaseio.com', // replace with your actual project URL
});

export const db = admin.firestore();
export const auth = admin.auth();
