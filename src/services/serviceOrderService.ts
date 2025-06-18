
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
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  where, // Keep for status filtering
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type ServiceOrderStatus = "Aberta" | "Em andamento" | "Aguardando peça" | "Concluída" | "Entregue" | "Cancelada";
export type DeviceType = "Celular" | "Notebook" | "Tablet" | "Placa" | "Outro";

export interface SoldProductItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ServiceOrderInput {
  deliveryForecastDate: string | null;
  status: ServiceOrderStatus;
  responsibleTechnicianName: string | null;
  clientName: string;
  clientCpfCnpj: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  deviceType: DeviceType | null;
  deviceBrandModel: string;
  deviceImeiSerial: string | null;
  deviceColor: string | null;
  deviceAccessories: string | null;
  problemReportedByClient: string;
  technicalDiagnosis: string | null;
  internalObservations: string | null;
  servicesPerformedDescription: string | null;
  partsUsedDescription: string | null;
  serviceManualValue: number;
  additionalSoldProducts: SoldProductItemInput[];
  grandTotalValue: number;
  // userId removed
}

export interface ServiceOrder extends ServiceOrderInput {
  id: string; // Firestore ID
  osNumber: string;
  openingDate: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  // userId removed
}

const SERVICE_ORDERS_COLLECTION = 'serviceOrders';

const serviceOrderFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): ServiceOrder => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    osNumber: data.osNumber || `OS-${docSnap.id.substring(0,6).toUpperCase()}`,
    deliveryForecastDate: data.deliveryForecastDate || null,
    status: data.status || "Aberta",
    responsibleTechnicianName: data.responsibleTechnicianName || null,
    clientName: data.clientName || '',
    clientCpfCnpj: data.clientCpfCnpj || null,
    clientPhone: data.clientPhone || null,
    clientEmail: data.clientEmail || null,
    deviceType: data.deviceType || null,
    deviceBrandModel: data.deviceBrandModel || '',
    deviceImeiSerial: data.deviceImeiSerial || null,
    deviceColor: data.deviceColor || null,
    deviceAccessories: data.deviceAccessories || null,
    problemReportedByClient: data.problemReportedByClient || '',
    technicalDiagnosis: data.technicalDiagnosis || null,
    internalObservations: data.internalObservations || null,
    servicesPerformedDescription: data.servicesPerformedDescription || null,
    partsUsedDescription: data.partsUsedDescription || null,
    serviceManualValue: data.serviceManualValue || 0,
    additionalSoldProducts: data.additionalSoldProducts || [],
    grandTotalValue: data.grandTotalValue || 0,
    openingDate: (data.openingDate instanceof Timestamp) ? data.openingDate.toDate() : (data.openingDate || new Date()),
    updatedAt: (data.updatedAt instanceof Timestamp) ? data.updatedAt.toDate() : data.updatedAt,
    // userId: data.userId || '', // userId removed
  };
};

const generateOsNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Date.now().toString().slice(-6); 
    return `OS-${year}${month}-${sequence}`;
};


export const addServiceOrder = async (orderData: ServiceOrderInput): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado.");

  const osNumber = await generateOsNumber();
  const docRef = await addDoc(collection(db, SERVICE_ORDERS_COLLECTION), {
    ...orderData,
    // userId: currentUser.uid, // userId removed
    osNumber: osNumber,
    openingDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return osNumber; 
};

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const q = query(
    collection(db, SERVICE_ORDERS_COLLECTION),
    // where('userId', '==', currentUser.uid), // userId removed
    orderBy('openingDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(serviceOrderFromDoc);
};

export const updateServiceOrder = async (id: string, orderData: Partial<Omit<ServiceOrder, 'id' | 'osNumber' | 'openingDate' | 'userId'>>): Promise<void> => {
  const orderRef = doc(db, SERVICE_ORDERS_COLLECTION, id);
  await updateDoc(orderRef, {
    ...orderData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteServiceOrder = async (id: string): Promise<string> => {
  const orderRef = doc(db, SERVICE_ORDERS_COLLECTION, id);
  await deleteDoc(orderRef);
  return id; 
};

export const getServiceOrdersByDateRangeAndStatus = async (
  startDate?: Date, 
  endDate?: Date, 
  status?: ServiceOrderStatus | "Todos"
): Promise<ServiceOrder[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  let conditions = [
    // where('userId', '==', currentUser.uid) // userId removed
  ];
  if (startDate) {
    conditions.push(where('openingDate', '>=', Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    conditions.push(where('openingDate', '<=', Timestamp.fromDate(endOfDay)));
  }
  if (status && status !== "Todos") {
    conditions.push(where('status', '==', status));
  }

  const q = query(
    collection(db, SERVICE_ORDERS_COLLECTION),
    ...conditions,
    orderBy('openingDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(serviceOrderFromDoc);
};

export const getCountOfOpenServiceOrders = async (): Promise<number> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return 0;

  const openStatuses: ServiceOrderStatus[] = ["Aberta", "Em andamento", "Aguardando peça"];
  const q = query(
    collection(db, SERVICE_ORDERS_COLLECTION),
    // where('userId', '==', currentUser.uid), // userId removed
    where('status', 'in', openStatuses)
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

export const getTotalCompletedServiceOrdersRevenue = async (): Promise<number> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return 0;

  const q = query(
    collection(db, SERVICE_ORDERS_COLLECTION),
    // where('userId', '==', currentUser.uid), // userId removed
    where('status', 'in', ['Concluída', 'Entregue'])
  );
  const querySnapshot = await getDocs(q);
  let totalRevenue = 0;
  querySnapshot.forEach((docSnap) => {
    totalRevenue += (docSnap.data().grandTotalValue as number) || 0;
  });
  return totalRevenue;
};

