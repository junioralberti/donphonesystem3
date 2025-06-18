
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, type DocumentData } from 'firebase/firestore';
// Firebase Storage imports (ref, uploadBytes, getDownloadURL, deleteObject) are no longer needed here.
import { db } from '@/lib/firebase'; 

const SETTINGS_COLLECTION = 'systemSettings';
const ESTABLISHMENT_DOC_ID = 'establishmentDetails';
// LOGO_STORAGE_PATH is no longer needed here.

export interface EstablishmentSettings {
  businessName?: string;
  businessAddress?: string;
  businessCnpj?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl?: string; // Kept in interface as it might exist in Firestore, but not actively managed by this service anymore for setting.
  updatedAt?: Timestamp;
}

const settingsFromDocData = (data: DocumentData | undefined): EstablishmentSettings | null => {
  if (!data) {
    return null;
  }
  return {
    businessName: data.businessName || "",
    businessAddress: data.businessAddress || "",
    businessCnpj: data.businessCnpj || "",
    businessPhone: data.businessPhone || "",
    businessEmail: data.businessEmail || "",
    logoUrl: data.logoUrl || "", // Will read if exists
    updatedAt: data.updatedAt,
  };
};

export const getEstablishmentSettings = async (): Promise<EstablishmentSettings | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, ESTABLISHMENT_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return settingsFromDocData(docSnap.data());
  }
  return null;
};

export const saveEstablishmentSettings = async (
  settingsData: Omit<EstablishmentSettings, 'updatedAt' | 'logoUrl'>
  // logoFile parameter removed
): Promise<EstablishmentSettings> => {
  console.log("Attempting to save establishment settings (logo management removed).");
  const docRef = doc(db, SETTINGS_COLLECTION, ESTABLISHMENT_DOC_ID);

  // Logic for handling logoFile, currentLogoUrl, logoStorageRef, upload, delete is removed.
  // The logoUrl field will not be explicitly set or modified in Firestore by this function.
  // If it exists, it remains; if not, it's not added.

  const dataToSave: Partial<EstablishmentSettings> = {
    ...settingsData,
    updatedAt: serverTimestamp() as Timestamp,
  };
  // dataToSave.logoUrl is NOT set here.

  console.log("Data to be saved in Firestore (logoUrl not managed here):", dataToSave);
  try {
    await setDoc(docRef, dataToSave, { merge: true }); // merge: true will keep existing logoUrl if present
    console.log("Establishment settings saved successfully to Firestore.");
  } catch (firestoreError) {
    console.error("Error saving settings to Firestore:", firestoreError);
    throw new Error(`Falha ao salvar configurações no banco de dados: ${firestoreError.message || 'Erro desconhecido no Firestore.'}`);
  }
  
  const savedDataSnap = await getDoc(docRef);
  const fullSavedData = settingsFromDocData(savedDataSnap.data());
  console.log("Full settings data after save (logoUrl reflects what's in DB):", fullSavedData);
  
  return fullSavedData || { 
    businessName: settingsData.businessName ?? "",
    businessAddress: settingsData.businessAddress ?? "",
    businessCnpj: settingsData.businessCnpj ?? "",
    businessPhone: settingsData.businessPhone ?? "",
    businessEmail: settingsData.businessEmail ?? "",
    logoUrl: (await getDoc(docRef)).data()?.logoUrl || "", // Read back whatever logoUrl is in DB
  };
};

    