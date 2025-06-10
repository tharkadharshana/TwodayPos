
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument, getStoreDetails } from '@/lib/firestoreUtils'; 
import type { UserDocument, Store } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: FirebaseUser | null;
  userDoc: UserDocument | null;
  storeDetails: Store | null;
  loading: boolean;
  storeId: string | null;
  refreshStoreDetails: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [storeDetails, setStoreDetails] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const fetchStoreData = useCallback(async (currentStoreId: string | null) => {
    if (currentStoreId) {
      try {
        const details = await getStoreDetails(currentStoreId);
        if (details) {
          setStoreDetails(details);
        } else {
          console.warn(`Store details not found for storeId: ${currentStoreId} in UserContext.`);
          toast({
            title: "Store Load Error",
            description: "Could not load store configuration.",
            variant: "destructive",
          });
          setStoreDetails(null);
        }
      } catch (error) {
        console.error("Error fetching store details in UserContext:", error);
        toast({
          title: "Store Load Error",
          description: "Could not load store configuration.",
          variant: "destructive",
        });
        setStoreDetails(null);
      }
    } else {
      setStoreDetails(null);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let firestoreUserDoc = await getUserDocument(firebaseUser.uid);
          if (!firestoreUserDoc) {
            console.warn(`User document not found for UID: ${firebaseUser.uid} in UserContext.`);
            toast({
                title: "Account Setup Incomplete",
                description: `User profile for ${firebaseUser.email} not found. Try logging out and registering again.`,
                variant: "destructive",
                duration: 10000,
            });
            setUserDoc(null);
            setStoreDetails(null); // Clear store details if user doc is missing
          } else {
            setUserDoc(firestoreUserDoc);
            await fetchStoreData(firestoreUserDoc.storeId); // Fetch store details after user doc
          }
        } catch (error) {
          console.error("Error fetching user document in UserContext:", error);
          toast({
            title: "Profile Load Error",
            description: "Could not load your user profile data.",
            variant: "destructive",
          });
          setUserDoc(null);
          setStoreDetails(null);
        }
      } else {
        setUser(null);
        setUserDoc(null);
        setStoreDetails(null);
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, toast, fetchStoreData]);

  const refreshStoreDetails = useCallback(async () => {
    if (userDoc?.storeId) {
      setLoading(true); // Optionally set loading state
      await fetchStoreData(userDoc.storeId);
      setLoading(false); // Clear loading state
    }
  }, [userDoc?.storeId, fetchStoreData]);

  return (
    <UserContext.Provider value={{ user, userDoc, storeDetails, loading, storeId: userDoc?.storeId || null, refreshStoreDetails }}>
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
