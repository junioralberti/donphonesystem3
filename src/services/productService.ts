
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
  limit,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  getDoc,
  where, // Keep for getProductBySku if SKU should be unique globally or per user
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import type { Product } from '@/lib/schemas/product';

const PRODUCTS_COLLECTION = 'products';
const PRODUCT_IMAGES_STORAGE_PATH = 'product_images'; // Path no longer includes userId

const productFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Product => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    sku: data.sku || '',
    price: data.price || 0,
    stock: data.stock || 0,
    imageUrl: data.imageUrl || '',
    createdAt: (data.createdAt as Timestamp)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate(),
  };
};

const handleImageUpload = async (productId: string, imageFile: File): Promise<string> => {
  const imageRef = ref(storage, `${PRODUCT_IMAGES_STORAGE_PATH}/${productId}/${imageFile.name}`);
  await uploadBytes(imageRef, imageFile);
  return getDownloadURL(imageRef);
};

const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl || imageUrl.includes('placehold.co')) return;
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn('Image to delete not found in storage:', imageUrl);
    } else {
      console.error('Error deleting image from storage:', error);
    }
  }
};

export const addProduct = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>,
  imageFile?: File | null
): Promise<string> => {
  // const user = auth.currentUser;
  // if (!user) throw new Error("Usuário não autenticado.");

  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    imageUrl: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  let imageUrl = '';
  if (imageFile) {
    imageUrl = await handleImageUpload(docRef.id, imageFile);
    await updateDoc(docRef, { imageUrl });
  }

  return docRef.id;
};

export const getProducts = async (): Promise<Product[]> => {
  // const user = auth.currentUser;
  // if (!user) return [];

  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('name', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(productFromDoc);
};

export const updateProduct = async (
  id: string,
  productData: Partial<Omit<Product, 'id' | 'createdAt' | 'imageUrl'>>,
  imageFile?: File | null | undefined,
  currentImageUrl?: string
): Promise<void> => {
  // const user = auth.currentUser;
  // if (!user) throw new Error("Usuário não autenticado.");

  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const updateData: Partial<Product> = { ...productData, updatedAt: serverTimestamp() as Timestamp };

  if (imageFile === null) { // Explicitly remove image
    if (currentImageUrl) {
      await deleteImageFromStorage(currentImageUrl);
    }
    updateData.imageUrl = '';
  } else if (imageFile instanceof File) { // Upload new or replace existing
    if (currentImageUrl) {
      await deleteImageFromStorage(currentImageUrl);
    }
    updateData.imageUrl = await handleImageUpload(id, imageFile);
  }
  // If imageFile is undefined, no change to imageUrl unless explicitly set in productData

  await updateDoc(productRef, updateData);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    const productData = productSnap.data() as Product;
    if (productData.imageUrl) {
      await deleteImageFromStorage(productData.imageUrl);
    }
  }
  await deleteDoc(productRef);
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  // const user = auth.currentUser; // If SKU is globally unique, user context not needed for filter
  // if (!user) return null; 
  if (!sku || sku.trim() === "") {
    return null;
  }
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where("sku", "==", sku.trim().toUpperCase()), // SKU might still be globally unique
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return productFromDoc(querySnapshot.docs[0]);
  }
  return null;
};
