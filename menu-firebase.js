import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

const menusRef = collection(db, "menus");

export function watchMenus(callback) {
  return onSnapshot(menusRef, snapshot => {
    const menus = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    callback(menus);
  });
}