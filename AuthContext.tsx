import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapAuthCodeToMessage = (authCode: string): string => {
  switch (authCode) {
    case 'auth/email-already-in-use':
      return 'Este endereço de e-mail já está em uso.';
    case 'auth/invalid-email':
      return 'Por favor, insira um endereço de e-mail válido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-credential':
      return 'E-mail ou senha inválidos. Por favor, tente novamente.';
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado para login. Adicione-o à lista de Domínios autorizados no Console do Firebase.';
    default:
      return `Ocorreu um erro inesperado (${authCode}). Por favor, tente novamente.`;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
       console.error("Error during email sign-up:", error);
       throw new Error(mapAuthCodeToMessage((error as AuthError).code));
    }
  }

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
       console.error("Error during email sign-in:", error);
       throw new Error(mapAuthCodeToMessage((error as AuthError).code));
    }
  }


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign-out:", error);
      throw new Error(mapAuthCodeToMessage((error as AuthError).code));
    }
  };

  const value = { user, loading, signUpWithEmail, signInWithEmail, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};