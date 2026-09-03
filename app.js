// app.js

import {
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  getOrdersRef,
  getDraftRef
} from "./firebase.js";

import {
  products
} from "./products.js";

import {
  clearCart
} from "./product.js";


// ============================================================
// 状態
// ============================================================

let currentTable = null;

let submittedOrders = [];

let unsubscribeOrders = null;

let unsubscribeDraft = null;

let isSubmittingOrder = false;

let draftSaveTimer = null;


// ============================================================
// DOM
// ============================================================

const tableConfirm =
  document.getElementById(
    "tableConfirm"
  );

const cartContent =
  document.getElementById(
    "cartContent"
  );

const confirmOrder =
  document.getElementById(
    "confirmOrder"
  );

const modal =
  document.getElementById(
    "modal"
  );

const modalMessage =
  document.getElementById(
    "modalMessage"
  );

const modalClose =
  document.getElementById(
    "modalClose"
  );

const orderOpen =
  document.getElementById(
    "orderOpen"
  );


// ============================================================
// 商品検索
// ============================================================

function getProduct(productId) {

  return products.find(
    product =>
      product.id ===
      Number(productId)
  );

}


// ============================================================
// テーブル番号取得
// ============================================================

function getCurrentTableNumber() {

  const selectedButton =
    document.querySelector(
      ".table-button.selected"
    );


  if (!selectedButton) {
    return null;
  }


  const number =
    Number(
      selectedButton.dataset.table
    );


  if (!number) {
    return null;
  }


  return number;

}


// ============================================================
// テーブル決定
// ============================================================

tableConfirm?.addEventListener(
  "click",
  () => {

    setTimeout(
      () => {

        const table =
          getCurrentTableNumber();


        if (!table) {
          return;
        }


        currentTable =
          table;


        loadTableData();

      },
      0
    );

  }
);


// ============================================================
// テーブルデータ読み込み
// ============================================================

async function loadTableData() {

  if (!currentTable) {
    return;
  }


  stopListeners();


  try {

    const snapshot =
      await getDocs(
        getOrdersRef(
          currentTable
        )
      );


    submittedOrders =
      snapshot.docs.map(
        orderDoc => ({

          id:
            orderDoc.id,

          ...orderDoc.data()

        })
      );


    sortOrders();

    watchOrders();

    watchDraft();

    renderHistory();

    updateTotalDisplay();


  } catch (error) {

    console.error(
      "テーブルデータ読み込みエラー:",
      error
    );

  }

}


// ============================================================
// 注文履歴リアルタイム監視
// ============================================================

function watchOrders() {

  if (!currentTable) {
    return;
  }


  unsubscribeOrders =
    onSnapshot(
      getOrdersRef(
        currentTable
      ),

      snapshot => {

        submittedOrders =
          snapshot.docs.map(
            orderDoc => ({

              id:
                orderDoc.id,

              ...orderDoc.data()

            })
          );


        sortOrders();

        renderHistory();

        updateTotalDisplay();

      },

      error => {

        console.error(
          "注文履歴監視エラー:",
          error
        );

      }
    );

}


// ============================================================
// 未確定注文監視
// ============================================================

function watchDraft() {

  if (!currentTable) {
    return;
  }


  unsubscribeDraft =
    onSnapshot(
      getDraftRef(
        currentTable
      ),

      snapshot => {

        if (!snapshot.exists()) {

          console.log(
            "未確定注文はありません"
          );

          return;

        }


        console.log(
          "未確定注文:",
          snapshot.data()
        );

      },

      error => {

        console.error(
          "未確定注文監視エラー:",
          error
        );

      }
    );

}


// ============================================================
// Firebase監視停止
// ============================================================

function stopListeners() {

  if (unsubscribeOrders) {

    unsubscribeOrders();

    unsubscribeOrders =
      null;

  }


  if (unsubscribeDraft) {

    unsubscribeDraft();

    unsubscribeDraft =
      null;

  }

}


// ============================================================
// 注文履歴を新しい順に並べる
// ============================================================

function sortOrders() {

  submittedOrders.sort(
    (a, b) => {

      const timeA =
        getTimestamp(
          a.createdAt
        );

      const timeB =
        getTimestamp(
          b.createdAt
        );


      return timeB -
        timeA;

    }
  );

}


// ============================================================
// Timestamp取得
// ============================================================

function getTimestamp(value) {

  if (
    value &&
    typeof value.toMillis ===
      "function"
  ) {

    return value.toMillis();

  }


  if (
    value instanceof Date
  ) {

    return value.getTime();

  }


  return 0;

}


// ============================================================
// 注文時刻表示
// ============================================================

function formatOrderTime(value) {

  let date =
    null;


  if (
    value &&
    typeof value.toDate ===
      "function"
  ) {

    date =
      value.toDate();

  } else if (
    value instanceof Date
  ) {

    date =
      value;

  }


  if (!date) {

    return "注文時刻を取得中";

  }


  return date.toLocaleString(
    "ja-JP",
    {

      month:
        "numeric",

      day:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}


// ============================================================
// 注文確定
// ============================================================

confirmOrder?.addEventListener(
  "click",
  event => {

    event.preventDefault();

    event.stopImmediatePropagation();

    confirmOrderToFirebase();

  },
  true
);


// ============================================================
// Firebaseへ注文保存
// ============================================================

async function confirmOrderToFirebase() {

  // 二重送信防止
  if (isSubmittingOrder) {
    return;
  }


  currentTable =
    currentTable ||
    getCurrentTableNumber();


  if (!currentTable) {

    alert(
      "テーブルが選択されていません。"
    );

    return;

  }


  // 現在のカートを取得
  const items =
    readCurrentCart();


  if (items.length === 0) {
    return;
  }


  // ★ 予約中のdraft保存をキャンセル
  clearTimeout(
    draftSaveTimer
  );

  draftSaveTimer =
    null;


  // ★ 注文処理中
  isSubmittingOrder =
    true;


  if (confirmOrder) {

    confirmOrder.disabled =
      true;

  }


  try {

    // ------------------------------------------
    // 合計
    // ------------------------------------------

    const total =
      items.reduce(
        (sum, item) =>
          sum +
          item.subtotal,
        0
      );


    // ------------------------------------------
    // Firestoreへ注文保存
    // ------------------------------------------

    const orderRef =
      await addDoc(
        getOrdersRef(
          currentTable
        ),
        {

          tableNumber:
            currentTable,

          status:
            "注文済み",

          items,

          total,

          createdAt:
            serverTimestamp()

        }
      );


    console.log(
      "注文を保存しました:",
      orderRef.id
    );


    // ------------------------------------------
    // draft削除
    // ------------------------------------------

    try {

      await deleteDoc(
        getDraftRef(
          currentTable
        )
      );


      console.log(
        "注文完了：draftを削除しました"
      );


    } catch (error) {

      console.warn(
        "draft削除エラー:",
        error
      );

    }


    // ------------------------------------------
    // ★ カートを完全に空にする
    // ------------------------------------------

    clearCart();


    // ------------------------------------------
    // 注文履歴を再表示
    // ------------------------------------------

    renderHistory();

    updateTotalDisplay();


    // ------------------------------------------
    // 完了モーダル
    // ------------------------------------------

    if (modalMessage) {

      modalMessage.textContent =
        `テーブル ${currentTable} のご注文を受け付けました。`;

    }


    if (modal) {

      modal.classList.add(
        "show"
      );

    }


  } catch (error) {

    console.error(
      "注文送信エラー:",
      error
    );


    alert(
      "注文の送信に失敗しました。\nもう一度お試しください。"
    );


  } finally {

    isSubmittingOrder =
      false;


    if (confirmOrder) {

      confirmOrder.disabled =
        true;

    }


    updateTotalDisplay();

  }

}


// ============================================================
// 現在のカート内容をDOMから取得
// ============================================================

function readCurrentCart() {

  const cartElements =
    document.querySelectorAll(
      "#cartContent .cart-item:not(.firebase-history)"
    );


  const items = [];


  cartElements.forEach(
    cartItem => {

      const quantityButton =
        cartItem.querySelector(
          ".quantity button[data-id]"
        );


      const quantityElement =
        cartItem.querySelector(
          ".quantity-number"
        );


      if (
        !quantityButton ||
        !quantityElement
      ) {

        return;

      }


      const productId =
        Number(
          quantityButton.dataset.id
        );


      const quantity =
        Number(
          quantityElement.textContent
        );


      const product =
        getProduct(
          productId
        );


      if (!product) {
        return;
      }


      if (quantity <= 0) {
        return;
      }


      items.push({

        productId:
          product.id,

        name:
          product.name,

        price:
          product.price,

        quantity,

        subtotal:
          product.price *
          quantity

      });

    }
  );


  return items;

}


// ============================================================
// 注文履歴表示
// ============================================================

function renderHistory() {

  if (!cartContent) {
    return;
  }


  cartContent
    .querySelectorAll(
      ".firebase-history"
    )
    .forEach(
      element => {

        element.remove();

      }
    );


  if (
    submittedOrders.length === 0
  ) {

    return;

  }


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "firebase-history";


  title.style.fontSize =
    "32px";

  title.style.fontWeight =
    "800";

  title.style.color =
    "#1d2732";

  title.style.margin =
    "35px 0 20px";


  title.textContent =
    "注文履歴";


  cartContent.appendChild(
    title
  );


  submittedOrders.forEach(
    order => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "cart-item firebase-history";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "cart-item-top";


      const status =
        document.createElement(
          "div"
        );


      status.className =
        "cart-item-name";


      status.textContent =
        order.status ||
        "注文済み";


      status.style.color =
        "#3f8d59";


      const time =
        document.createElement(
          "div"
        );


      time.className =
        "cart-item-price";


      time.textContent =
        formatOrderTime(
          order.createdAt
        );


      header.appendChild(
        status
      );

      header.appendChild(
        time
      );


      card.appendChild(
        header
      );


      if (
        Array.isArray(
          order.items
        )
      ) {

        order.items.forEach(
          item => {

            const product =
              getProduct(
                item.productId
              );


            const name =
              product?.name ||
              item.name ||
              "不明な商品";


            const price =
              Number(
                item.price ??
                product?.price ??
                0
              );


            const quantity =
              Number(
                item.quantity ||
                0
              );


            const subtotal =
              Number(
                item.subtotal ??
                price *
                quantity
              );


            const row =
              document.createElement(
                "div"
              );


            row.style.display =
              "flex";

            row.style.justifyContent =
              "space-between";

            row.style.alignItems =
              "center";

            row.style.gap =
              "20px";

            row.style.marginTop =
              "22px";


            const nameElement =
              document.createElement(
                "div"
              );


            nameElement.style.fontSize =
              "26px";

            nameElement.style.fontWeight =
              "700";

            nameElement.style.color =
              "#202a34";


            nameElement.textContent =
              `${name} × ${quantity}`;


            const priceElement =
              document.createElement(
                "div"
              );


            priceElement.style.fontSize =
              "26px";

            priceElement.style.fontWeight =
              "800";

            priceElement.style.color =
              "#202a34";

            priceElement.style.whiteSpace =
              "nowrap";


            priceElement.textContent =
              `¥${subtotal.toLocaleString()}`;


            row.appendChild(
              nameElement
            );

            row.appendChild(
              priceElement
            );


            card.appendChild(
              row
            );

          }
        );

      }


      const total =
        document.createElement(
          "div"
        );


      total.style.marginTop =
        "25px";

      total.style.paddingTop =
        "20px";

      total.style.borderTop =
        "1px solid #e5e8eb";

      total.style.textAlign =
        "right";

      total.style.fontSize =
        "29px";

      total.style.fontWeight =
        "900";

      total.style.color =
        "#1d2732";


      total.textContent =
        `注文合計 ¥${Number(
          order.total || 0
        ).toLocaleString()}`;


      card.appendChild(
        total
      );


      cartContent.appendChild(
        card
      );

    }
  );

}


// ============================================================
// 合計金額更新
// ============================================================

function updateTotalDisplay() {

  const orderTotal =
    document.getElementById(
      "orderTotal"
    );


  const cartTotal =
    document.getElementById(
      "cartTotal"
    );


  const historyTotal =
    submittedOrders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.total || 0
        ),
      0
    );


  const currentCartTotal =
    readDisplayedCurrentCartTotal();


  const total =
    historyTotal +
    currentCartTotal;


  if (orderTotal) {

    orderTotal.textContent =
      `¥${total.toLocaleString()}`;

  }


  if (cartTotal) {

    cartTotal.textContent =
      `¥${total.toLocaleString()}`;

  }

}


// ============================================================
// 現在のカート合計
// ============================================================

function readDisplayedCurrentCartTotal() {

  const items =
    readCurrentCart();


  return items.reduce(
    (sum, item) =>
      sum +
      item.subtotal,
    0
  );

}


// ============================================================
// 注文内容を見る
// ============================================================

orderOpen?.addEventListener(
  "click",
  () => {

    setTimeout(
      () => {

        renderHistory();

        updateTotalDisplay();

      },
      0
    );

  }
);


// ============================================================
// カート変更監視
// ============================================================

document.addEventListener(
  "click",
  event => {

    const addButton =
      event.target.closest(
        ".add-button"
      );


    const quantityButton =
      event.target.closest(
        ".quantity button"
      );


    if (
      !addButton &&
      !quantityButton
    ) {

      return;

    }


    setTimeout(
      () => {

        renderHistory();

        updateTotalDisplay();

        scheduleDraftSave();

      },
      0
    );

  }
);


// ============================================================
// draft保存予約
// ============================================================

function scheduleDraftSave() {

  // 注文中なら保存しない
  if (isSubmittingOrder) {
    return;
  }


  clearTimeout(
    draftSaveTimer
  );


  draftSaveTimer =
    setTimeout(
      () => {

        saveDraft();

      },
      500
    );

}


// ============================================================
// 未確定注文をFirestoreへ保存
// ============================================================

async function saveDraft() {

  if (!currentTable) {
    return;
  }


  // ★ 注文確定中は保存しない
  if (isSubmittingOrder) {
    return;
  }


  const items =
    readCurrentCart();


  const draftRef =
    getDraftRef(
      currentTable
    );


  try {

    // カートが空ならdraftも削除
    if (
      items.length === 0
    ) {

      await deleteDoc(
        draftRef
      );

      console.log(
        "空のカート：draftを削除しました"
      );

      return;

    }


    await setDoc(
      draftRef,
      {

        tableNumber:
          currentTable,

        items:
          items.map(
            item => ({

              productId:
                item.productId,

              quantity:
                item.quantity

            })
          ),

        updatedAt:
          serverTimestamp()

      }
    );


    console.log(
      "未確定注文を保存しました"
    );


  } catch (error) {

    console.error(
      "未確定注文保存エラー:",
      error
    );

  }

}


// ============================================================
// 注文完了モーダル「閉じる」
// ============================================================

modalClose?.addEventListener(
  "click",
  event => {

    event.preventDefault();

    event.stopPropagation();


    if (modal) {

      modal.classList.remove(
        "show"
      );

    }


    // ★ 念のためカートを完全に空にする
    clearCart();


    // 注文履歴を再表示
    renderHistory();

    updateTotalDisplay();

  }
);


// ============================================================
// 1080 × 1920
// ============================================================

function resizeContainer() {

  const baseWidth =
    1080;

  const baseHeight =
    1920;


  const scale =
    Math.min(
      window.innerWidth /
        baseWidth,

      window.innerHeight /
        baseHeight
    );


  const parent =
    document.getElementById(
      "parentContainer"
    );


  if (!parent) {
    return;
  }


  parent.style.transform =
    `translate(-50%, -50%) scale(${scale})`;

}


window.addEventListener(
  "resize",
  resizeContainer
);


window.addEventListener(
  "orientationchange",
  resizeContainer
);


resizeContainer();


// ============================================================
// 起動確認
// ============================================================

console.log(
  "かいせい食堂 注文Firebase機能 起動"
);