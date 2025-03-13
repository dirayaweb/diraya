import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(public auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  register(
    email: string,
    password: string,
    username: string,
    allergies: string[]
  ): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then(
        (userCredential) => {
          const userRef = doc(
            this.firestore,
            `users/${userCredential.user.uid}`
          );
          return setDoc(userRef, { email, username, allergies }).then(
            () => userCredential.user
          );
        }
      )
    );
  }

  login(email: string, password: string, rememberMe: boolean): Observable<any> {
    return from(
      setPersistence(
        this.auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      ).then(() => signInWithEmailAndPassword(this.auth, email, password))
    );
  }

  googleSignIn(rememberMe: boolean): Observable<any> {
    return from(
      setPersistence(
        this.auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      ).then(() => signInWithPopup(this.auth, new GoogleAuthProvider()))
    );
  }

  saveAllergies(uid: string, allergies: string[]): Observable<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(
      getDoc(userRef).then((docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : {};
        const newData = { ...(data || {}), allergies };
        return setDoc(userRef, newData, { merge: true });
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getUserData(uid: string): Observable<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(
      getDoc(userRef).then((snapshot) =>
        snapshot.exists() ? snapshot.data() : null
      )
    );
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
