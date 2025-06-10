
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument } from '@/lib/firestoreUtils'; // createInitialStoreForUser is used in register-form
import type { UserDocument } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: FirebaseUser | null;
  userDoc: UserDocument | null;
  loading: boolean;
  storeId: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let firestoreUserDoc = await getUserDocument(firebaseUser.uid);
          if (!firestoreUserDoc) {
            // This case is primarily handled during registration.
            // If a user is authenticated but has no userDoc, it implies an issue
            // during registration or a manual data inconsistency.
            // The registration flow in `register-form.tsx` is responsible for creating
            // the store and user document.
            console.warn(`User document not found for UID: ${firebaseUser.uid}. This user might need to complete registration or setup, or there might be a data inconsistency.`);
            toast({
                title: "Account Incomplete",
                description: "Your user profile is incomplete. Some features may not work as expected. Please try re-logging or contact support.",
                variant: "destructive",
            });
            setUserDoc(null); 
          } else {
            setUserDoc(firestoreUserDoc);
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          toast({
            title: "Error",
            description: "Could not load your user profile.",
            variant: "destructive",
          });
          setUserDoc(null);
        }
      } else {
        setUser(null);
        setUserDoc(null);
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, toast]);

  return (
    <UserContext.Provider value={{ user, userDoc, loading, storeId: userDoc?.storeId || null }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
