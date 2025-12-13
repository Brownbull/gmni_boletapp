import { useState, useEffect } from 'react';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
    getAuth,
    Auth,
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    connectAuthEmulator,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
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
    signInWithTestCredentials: (email?: string, password?: string) => Promise<void>;
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

            // Initialize Firebase app (reuse existing if already initialized)
            let app: FirebaseApp;
            let auth: Auth;
            let db: Firestore;

            if (getApps().length > 0) {
                app = getApps()[0];
                auth = getAuth(app);
                db = getFirestore(app);
            } else {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                // Connect to Firebase emulators IMMEDIATELY after first init
                // MUST be called before any auth operations
                const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
                if (isDev) {
                    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
                    connectFirestoreEmulator(db, '127.0.0.1', 8080);
                    console.log('[useAuth] Connected to Firebase emulators');
                }
            }

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
            // Always show account picker, even if user is already signed into Google
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(services.auth, provider);
        } catch (e: any) {
            alert("Login Failed: " + e.message);
        }
    };

    const signInWithTestCredentials = async (
        email: string = 'khujta@gmail.com',
        password: string = 'password.123'
    ) => {
        console.log('[signInWithTestCredentials] Starting...');
        console.log('[signInWithTestCredentials] services:', !!services);

        if (!services) {
            console.error('[signInWithTestCredentials] No services available!');
            return;
        }

        // Only allow in development/test environments
        const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
        console.log('[signInWithTestCredentials] isDev:', isDev);

        if (!isDev) {
            throw new Error('Test authentication is only available in development/test environments');
        }

        // Log auth config to see emulator settings
        console.log('[signInWithTestCredentials] Auth emulator host:', (services.auth as any).emulatorConfig);
        console.log('[signInWithTestCredentials] Attempting sign in with:', email);

        try {
            const result = await signInWithEmailAndPassword(services.auth, email, password);
            console.log('[signInWithTestCredentials] Success!', result.user.email);
        } catch (e: any) {
            console.error("[signInWithTestCredentials] Failed:", e.code, e.message);
            alert("Test Login Failed: " + e.message);
        }
    };

    const signOut = async () => {
        if (!services) return;
        await firebaseSignOut(services.auth);
    };

    return { user, services, initError, signIn, signInWithTestCredentials, signOut };
}
