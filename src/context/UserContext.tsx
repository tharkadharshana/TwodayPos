
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument } from '@/lib/firestoreUtils'; 
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
            console.warn(`User document not found for UID: ${firebaseUser.uid} in UserContext. This usually means the registration process didn't complete Firestore writes or the document was deleted. User: ${firebaseUser.email}`);
            toast({
                title: "Account Setup Incomplete",
                description: `User profile for ${firebaseUser.email} not found in database. Try logging out and registering again, or contact support if this persists.`,
                variant: "destructive",
                duration: 10000, // Keep message longer
            });
            setUserDoc(null); 
          } else {
            setUserDoc(firestoreUserDoc);
          }
        } catch (error) {
          console.error("Error fetching user document in UserContext:", error);
          toast({
            title: "Profile Load Error",
            description: "Could not load your user profile data.",
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
