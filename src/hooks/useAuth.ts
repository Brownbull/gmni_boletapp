import { useState, useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

export interface Services {
    auth: Auth;
    db: Firestore;
    appId: string;
}

export interface UseAuthReturn {
    user: User | null;
    services: Services | null;
    initError: string | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [services, setServices] = useState<Services | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        try {
            // Use the config from environment variables
            if (!firebaseConfig || !firebaseConfig.projectId) {
                throw new Error("Firebase Config Missing");
            }

            const app: FirebaseApp = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const appId = firebaseConfig.projectId;

            setServices({ auth, db, appId });

            // Standard Firebase Auth Listener
            const unsubscribe = onAuthStateChanged(auth, setUser);
            return unsubscribe;
        } catch (e: any) {
            console.error(e);
            setInitError(e.message);
        }
    }, []);

    const signIn = async () => {
        if (!services) return;
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(services.auth, provider);
        } catch (e: any) {
            alert("Login Failed: " + e.message);
        }
    };

    const signOut = async () => {
        if (!services) return;
        await firebaseSignOut(services.auth);
    };

    return { user, services, initError, signIn, signOut };
}
