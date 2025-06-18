
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
  // where, // No longer filtering by userId
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Provider } from '@/lib/schemas/provider';

const PROVIDERS_COLLECTION = 'providers';

const providerFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Provider => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    contactPerson: data.contactPerson || '',
    email: data.email || '',
    phone: data.phone || '',
    cnpj: data.cnpj || '',
    address: data.address || '',
    createdAt: (data.createdAt as Timestamp)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate(),
  };
};

export const addProvider = async (providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // const user = auth.currentUser;
  // if (!user) throw new Error("Usuário não autenticado.");

  const docRef = await addDoc(collection(db, PROVIDERS_COLLECTION), {
    ...providerData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getProviders = async (): Promise<Provider[]> => {
  // const user = auth.currentUser;
  // if (!user) return [];

  const q = query(
    collection(db, PROVIDERS_COLLECTION),
    orderBy('name', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(providerFromDoc);
};

export const updateProvider = async (id: string, providerData: Partial<Omit<Provider, 'id' | 'createdAt'>>): Promise<void> => {
  const providerRef = doc(db, PROVIDERS_COLLECTION, id);
  await updateDoc(providerRef, {
    ...providerData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProvider = async (id: string): Promise<void> => {
  const providerRef = doc(db, PROVIDERS_COLLECTION, id);
  await deleteDoc(providerRef);
};
