// firebase.js

import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// =========================================
// Firebase設定
// =========================================

const firebaseConfig = {
  apiKey:
    "AIzaSyBAkEDLUbIHTNQebpguQmD9DJTbfI4DTck",

  authDomain:
    "hotel-kaisei01.firebaseapp.com",

  projectId:
    "hotel-kaisei01",

  storageBucket:
    "hotel-kaisei01.firebasestorage.app",

  messagingSenderId:
    "386291470120",

  appId:
    "1:386291470120:web:1ee5076f412956a0140a1d",

  measurementId:
    "G-R2C2XFRHPK"
};


// =========================================
// Firebase初期化
// =========================================

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);


// =========================================
// Firestore
// =========================================

export const db =
  getFirestore(app);


// =========================================
// Firebase機能
// =========================================

export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot
};


// =========================================
// テーブル
// =========================================

export function getTableRef(tableNumber) {

  return doc(
    db,
    "tables",
    `table_${tableNumber}`
  );

}


// =========================================
// 注文履歴
// =========================================

export function getOrdersRef(tableNumber) {

  return collection(
    db,
    "tables",
    `table_${tableNumber}`,
    "orders"
  );

}


// =========================================
// 未確定注文
// =========================================

export function getDraftRef(tableNumber) {

  return doc(
    db,
    "tables",
    `table_${tableNumber}`,
    "currentOrder",
    "draft"
  );

}