import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

// lấy tất cả món từ collection "foods"
export const getAllFoods = async () => {
  const snap = await getDocs(collection(db, "foods"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const getFoodById = async (id) => {
  const ref = doc(db, "foods", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getFoodsByCategory = async (cat) => {
  const q = query(collection(db, "foods"), where("category", "==", cat));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
