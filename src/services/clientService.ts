
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  // where, // No longer filtering by userId here
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Client } from '@/lib/schemas/client';

const CLIENTS_COLLECTION = 'clients';

const clientFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Client => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    createdAt: (data.createdAt as Timestamp)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate(),
  };
};

export const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // const user = auth.currentUser; // User context might still be needed if rules depend on isAuthenticated
  // if (!user) throw new Error("Usuário não autenticado."); // Keep if actions require auth

  const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...clientData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getClients = async (): Promise<Client[]> => {
  // const user = auth.currentUser; // Not needed if not filtering by userId
  // if (!user) return []; 

  const q = query(
    collection(db, CLIENTS_COLLECTION),
    orderBy('name', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(clientFromDoc);
};

export const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<void> => {
  const clientRef = doc(db, CLIENTS_COLLECTION, id);
  await updateDoc(clientRef, {
    ...clientData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteClient = async (id: string): Promise<void> => {
  const clientRef = doc(db, CLIENTS_COLLECTION, id);
  await deleteDoc(clientRef);
};
