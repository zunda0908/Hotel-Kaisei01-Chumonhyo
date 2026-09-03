// product.js

import {
  products
} from "./products.js";


// ============================================================
// 状態
// ============================================================

let currentTable = null;

let selectedCategory = "all";

let cart = {};


// ============================================================
// DOM
// ============================================================

const tableGrid =
  document.getElementById("tableGrid");

const tableScreen =
  document.getElementById("tableScreen");

const tableConfirm =
  document.getElementById("tableConfirm");

const tableSelectedInfo =
  document.getElementById("tableSelectedInfo");

const currentTableElement =
  document.getElementById("currentTable");

const cartTable =
  document.getElementById("cartTable");

const productsElement =
  document.getElementById("products");

const orderCount =
  document.getElementById("orderCount");

const orderTotal =
  document.getElementById("orderTotal");

const cartScreen =
  document.getElementById("cartScreen");

const cartContent =
  document.getElementById("cartContent");

const cartTotal =
  document.getElementById("cartTotal");

const confirmOrder =
  document.getElementById("confirmOrder");


// ============================================================
// テーブル1〜15を生成
// ============================================================

function createTables() {

  if (!tableGrid) {
    return;
  }

  tableGrid.innerHTML = "";

  for (let i = 1; i <= 15; i++) {

    const button =
      document.createElement("button");

    button.className =
      "table-button";

    button.dataset.table =
      i;

    button.innerHTML = `
      <div class="table-label">
        テーブル
      </div>

      <div class="table-number">
        ${i}
      </div>
    `;

    button.addEventListener(
      "click",
      () => {

        currentTable = i;

        document
          .querySelectorAll(".table-button")
          .forEach(btn => {

            btn.classList.remove(
              "selected"
            );

          });

        button.classList.add(
          "selected"
        );

        if (tableSelectedInfo) {

          tableSelectedInfo.textContent =
            `テーブル ${i} が選択されています`;

        }

        if (tableConfirm) {

          tableConfirm.disabled =
            false;

          tableConfirm.classList.add(
            "enabled"
          );

        }

      }
    );

    tableGrid.appendChild(
      button
    );

  }

}


// ============================================================
// テーブル決定
// ============================================================

tableConfirm?.addEventListener(
  "click",
  () => {

    if (!currentTable) {
      return;
    }

    if (tableScreen) {

      tableScreen.style.display =
        "none";

    }

    if (currentTableElement) {

      currentTableElement.textContent =
        `テーブル ${currentTable}`;

    }

    if (cartTable) {

      cartTable.textContent =
        `テーブル ${currentTable}`;

    }

    renderProducts();

    updateCart();

  }
);


// ============================================================
// 商品表示
// ============================================================

function renderProducts() {

  if (!productsElement) {
    return;
  }

  productsElement.innerHTML = "";

  const filtered =
    selectedCategory === "all"
      ? products
      : products.filter(
          product =>
            product.category === selectedCategory
        );


  filtered.forEach(
    product => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "product-card";

      card.innerHTML = `
        <div class="product-name">
          ${product.name}
        </div>

        <div class="product-description">
          ${product.description}
        </div>

        <div class="product-bottom">

          <div class="product-price">
            ¥${product.price.toLocaleString()}
          </div>

          <button
            class="add-button"
            data-id="${product.id}"
          >
            +
          </button>

        </div>
      `;

      productsElement.appendChild(
        card
      );

    }
  );


  document
    .querySelectorAll(".add-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            addToCart(
              Number(
                button.dataset.id
              )
            );

          }
        );

      }
    );

}


// ============================================================
// カート追加
// ============================================================

function addToCart(id) {

  if (!cart[id]) {

    cart[id] =
      0;

  }

  cart[id]++;

  updateCart();

}


// ============================================================
// 数量変更
// ============================================================

function changeQuantity(
  id,
  amount
) {

  if (!cart[id]) {
    return;
  }

  cart[id] +=
    amount;

  if (
    cart[id] <= 0
  ) {

    delete cart[id];

  }

  updateCart();

}


// ============================================================
// カートを完全に空にする
//
// ★ 今回の重要ポイント
// ============================================================

export function clearCart() {

  // JavaScript内部のカートを完全に空にする
  cart = {};

  // 画面も空にする
  updateCart();

  console.log(
    "カートを完全にリセットしました"
  );

}


// ============================================================
// カート更新
// ============================================================

function updateCart() {

  let count =
    0;

  let total =
    0;


  Object.keys(cart).forEach(
    id => {

      const product =
        products.find(
          item =>
            item.id ===
            Number(id)
        );


      if (!product) {
        return;
      }


      count +=
        cart[id];


      total +=
        product.price *
        cart[id];

    }
  );


  if (orderCount) {

    orderCount.textContent =
      `${count}点`;

  }


  if (orderTotal) {

    orderTotal.textContent =
      `¥${total.toLocaleString()}`;

  }


  if (cartTotal) {

    cartTotal.textContent =
      `¥${total.toLocaleString()}`;

  }


  if (confirmOrder) {

    confirmOrder.disabled =
      count === 0;

  }


  renderCart();

}


// ============================================================
// カート表示
// ============================================================

function renderCart() {

  if (!cartContent) {
    return;
  }

  cartContent.innerHTML =
    "";


  const ids =
    Object.keys(cart);


  if (ids.length === 0) {

    cartContent.innerHTML = `
      <div class="empty-cart">
        まだ商品が入っていません
      </div>
    `;

    return;

  }


  ids.forEach(
    id => {

      const product =
        products.find(
          item =>
            item.id ===
            Number(id)
        );


      if (!product) {
        return;
      }


      const quantity =
        cart[id];


      const subtotal =
        product.price *
        quantity;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "cart-item";


      item.innerHTML = `
        <div class="cart-item-top">

          <div class="cart-item-name">
            ${product.name}
          </div>

          <div class="cart-item-price">
            ¥${product.price.toLocaleString()}
          </div>

        </div>

        <div class="cart-item-bottom">

          <div class="cart-subtotal">
            ¥${subtotal.toLocaleString()}
          </div>

          <div class="quantity">

            <button
              data-id="${product.id}"
              data-change="-1"
            >
              −
            </button>

            <div class="quantity-number">
              ${quantity}
            </div>

            <button
              data-id="${product.id}"
              data-change="1"
            >
              ＋
            </button>

          </div>

        </div>
      `;


      cartContent.appendChild(
        item
      );

    }
  );


  document
    .querySelectorAll(
      ".quantity button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            changeQuantity(
              Number(
                button.dataset.id
              ),
              Number(
                button.dataset.change
              )
            );

          }
        );

      }
    );

}


// ============================================================
// カートを開く
// ============================================================

document
  .getElementById("orderOpen")
  ?.addEventListener(
    "click",
    () => {

      if (cartScreen) {

        cartScreen.classList.add(
          "open"
        );

      }

      renderCart();

    }
  );


// ============================================================
// カートを閉じる
// ============================================================

document
  .getElementById("cartBack")
  ?.addEventListener(
    "click",
    () => {

      if (cartScreen) {

        cartScreen.classList.remove(
          "open"
        );

      }

    }
  );


// ============================================================
// カテゴリー
// ============================================================

document
  .querySelectorAll(
    ".category-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".category-button"
            )
            .forEach(
              btn => {

                btn.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          selectedCategory =
            button.dataset.category;


// 焼き物・昼の部の注意書き
const categoryNotice =
  document.getElementById(
    "categoryNotice"
  );

if (categoryNotice) {
  
  if (
    selectedCategory === "yakimono" ||
    selectedCategory === "noon"
  ) {
    
    if (selectedCategory === "yakimono") {
      
      categoryNotice.textContent =
        "※ グリルでじっくり焼き上げるため、お時間をいただきます。";
      
    } else if (selectedCategory === "noon") {
      
      categoryNotice.textContent =
        "※ 昼の部（11：30〜14：00）の時間帯にて注文いただけます。<br>ただし、ラストオーダーは13：30となっております。";
      
    }
    
    categoryNotice.classList.add(
      "show"
    );
    
  } else {
    
    categoryNotice.textContent =
      "";
    
    categoryNotice.classList.remove(
      "show"
    );
    
  }
  
}


renderProducts();

          renderProducts();

        }
      );

    }
  );


// ============================================================
// 初期化
// ============================================================

createTables();


// 起動時は必ずカートを空にする
clearCart();