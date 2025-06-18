
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
  where, // Keep for filtering by date/category/status
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Expense, ExpenseStatus, ExpenseCategory } from '@/lib/schemas/expense';
import { parseISO } from 'date-fns';

const EXPENSES_COLLECTION = 'expenses';

const expenseFromDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Expense => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || '',
    amount: data.amount || 0,
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : (typeof data.dueDate === 'string' ? parseISO(data.dueDate) : new Date()),
    category: data.category || 'Outros',
    status: data.status || 'Pendente',
    notes: data.notes || '',
    paymentDate: data.paymentDate instanceof Timestamp ? data.paymentDate.toDate() : (data.paymentDate ? parseISO(data.paymentDate) : null),
    createdAt: (data.createdAt as Timestamp)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate(),
  };
};

export const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'paymentDate'> & { dueDate: Date; paymentDate?: Date | null }): Promise<string> => {
  // const user = auth.currentUser;
  // if (!user) throw new Error("Usuário não autenticado.");
  
  const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
    ...expenseData,
    dueDate: Timestamp.fromDate(expenseData.dueDate),
    paymentDate: expenseData.paymentDate ? Timestamp.fromDate(expenseData.paymentDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

interface GetExpensesFilters {
  month?: number; 
  year?: number;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
}

export const getExpenses = async (filters?: GetExpensesFilters): Promise<Expense[]> => {
  // const user = auth.currentUser;
  // if (!user) return [];

  let conditions = []; // No longer start with userId filter

  if (filters?.status && filters.status !== "all") {
    conditions.push(where('status', '==', filters.status));
  }
  if (filters?.category && filters.category !== "all") {
    conditions.push(where('category', '==', filters.category));
  }

  if (filters?.year && filters?.month) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    conditions.push(where('dueDate', '>=', Timestamp.fromDate(startDate)));
    conditions.push(where('dueDate', '<=', Timestamp.fromDate(endDate)));
  } else if (filters?.year) {
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year, 11, 31, 23, 59, 59, 999);
    conditions.push(where('dueDate', '>=', Timestamp.fromDate(startDate)));
    conditions.push(where('dueDate', '<=', Timestamp.fromDate(endDate)));
  }
  
  const q = query(collection(db, EXPENSES_COLLECTION), ...conditions, orderBy('dueDate', 'asc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(expenseFromDoc);
};


export const updateExpense = async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'paymentDate'> & { dueDate?: Date; paymentDate?: Date | null | undefined }>): Promise<void> => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, id);
  
  const dataToUpdate: Partial<DocumentData> = { ...expenseData, updatedAt: serverTimestamp() };
  if (expenseData.dueDate) {
    dataToUpdate.dueDate = Timestamp.fromDate(expenseData.dueDate);
  }
  if (expenseData.hasOwnProperty('paymentDate')) { // Check if paymentDate is explicitly being set (even to null)
     dataToUpdate.paymentDate = expenseData.paymentDate ? Timestamp.fromDate(expenseData.paymentDate) : null;
  }

  await updateDoc(expenseRef, dataToUpdate);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, id);
  await deleteDoc(expenseRef);
};

export const getExpensesByDateRange = async (startDate: Date, endDate: Date): Promise<Expense[]> => {
  // const user = auth.currentUser;
  // if (!user) return [];

  const startTimestamp = Timestamp.fromDate(startDate);
  const endOfDayEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDayEndDate);

  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where('dueDate', '>=', startTimestamp),
    where('dueDate', '<=', endTimestamp),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(expenseFromDoc);
};
