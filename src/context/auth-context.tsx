
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, type User as FirebaseUserType } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/services/userService';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  isAuthenticated: boolean;
  firebaseUser: FirebaseUserType | null;
  login: (role: 'admin' | 'user', actualFirebaseUser: FirebaseUserType) => void; // For real Firebase login
  performMockLogin: (role: 'admin' | 'user') => void; // For mock login
  logout: () => void;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticatedViaMock, setIsAuthenticatedViaMock] = useState(false); // To track mock sessions
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) { // Real Firebase user signed in
        setIsAuthenticatedViaMock(false); // Clear any mock state
        setFirebaseUser(user);
        const userDataFromFirestore = await getUserById(user.uid);
        if (userDataFromFirestore && userDataFromFirestore.role) {
          setUserRole(userDataFromFirestore.role);
        } else {
          console.error("User in Auth but no role in Firestore. Logging out.");
          await signOut(auth); // Will trigger this callback again with user = null
        }
      } else { // No Firebase user signed in
        // If we are not in a mock session, then clear user data.
        // If we *are* in a mock session, this means Firebase signed out (or never signed in),
        // so the mock session should persist until explicitly logged out.
        if (!isAuthenticatedViaMock) {
            setFirebaseUser(null);
            setUserRole(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticatedViaMock]); // Re-evaluate if mock status changes

  const isAuthenticated = !!firebaseUser; // True if firebaseUser is real OR a mock object

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && pathname !== '/') {
        router.push('/');
      } else if (isAuthenticated && pathname === '/') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Login for REAL Firebase users (called from page.tsx after signInWithEmailAndPassword)
  const login = (role: 'admin' | 'user', actualFirebaseUser: FirebaseUserType) => {
    setIsAuthenticatedViaMock(false);
    setFirebaseUser(actualFirebaseUser);
    setUserRole(role);
    // Navigation is handled by useEffect based on isAuthenticated
  };

  // Login for MOCKED 'teste@donphone.com' user
  const performMockLogin = (role: 'admin' | 'user') => {
    // Set a mock FirebaseUser object so isAuthenticated becomes true and other parts of the app
    // that might expect firebaseUser.email etc. have something to work with.
    setFirebaseUser({ 
      uid: 'mock_admin_uid', 
      email: 'teste@donphone.com', 
      displayName: 'Admin Teste (Mocked)' 
    } as FirebaseUserType);
    setUserRole(role);
    setIsAuthenticatedViaMock(true);
    // Navigation is handled by useEffect based on isAuthenticated
  };

  const logout = async () => {
    if (isAuthenticatedViaMock) {
      setIsAuthenticatedViaMock(false);
      setFirebaseUser(null); // Clear the mock user
      setUserRole(null);
      router.push('/');
    } else {
      await signOut(auth); // Triggers onAuthStateChanged, which will clear firebaseUser and userRole
      // router.push('/'); // This is handled by the useEffect on isAuthenticated change
    }
  };
  
  if (loading && pathname !== '/') {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Carregando autenticação...</p></div>;
  }
  
  if (!isAuthenticated && pathname !== '/') {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, firebaseUser, login, logout, userRole, performMockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
