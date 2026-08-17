// =========================
// Load Cart
// =========================
// console.log("cart.js loaded");
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");
// =========================
// Display Cart
// =========================
function displayCart() {
    // 💡 HTML Element မရှိသည့် Page မျိုးတွင် Error မတက်စေရန် စစ်ပေးထားပါသည်
    if (!cartItems || !totalPrice) return;

    cartItems.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <h2 style="text-align:center;color:#750608;">
                Your Cart is Empty
            </h2>
        `;
        totalPrice.innerHTML = "0 MMK";
        return;
    }

    cart.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "cart-card";

        card.innerHTML = `
            <div class="cart-left">
                <img src="${item.image}" alt="${item.name}">
                <div class="food-info">
                    <h3>${item.name}</h3>
                    <p>${Number(item.price).toLocaleString()} MMK</p>
                </div>
            </div>

            <div class="cart-right">
                <button class="qty-btn" onclick="decreaseQty(${index})">-</button>
                <span class="qty">${item.qty}</span>
                <button class="qty-btn" onclick="increaseQty(${index})">+</button>
            </div>
        `;

        cartItems.appendChild(card);
        total += Number(item.price) * Number(item.qty);
    });

    totalPrice.innerHTML = total.toLocaleString() + " MMK";
}

// =========================
// Increase Quantity
// =========================
function increaseQty(index) {
    if (cart[index]) {
        cart[index].qty++;
        saveCart();
    }
}

// =========================
// Decrease Quantity
// =========================
function decreaseQty(index) {
    if (cart[index]) {
        cart[index].qty--;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

// =========================
// Save Cart to LocalStorage
// =========================
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

// =========================
// Start Initial Render
// =========================
displayCart();

// =========================
// Order Button Click Handler
// =========================
const orderBtn = document.getElementById("orderBtn");

// 💡 orderBtn ရှိမှသာ Event Listener ကို ဖွင့်ပေးမည်
if (orderBtn) {
    orderBtn.addEventListener("click", function () {
        let currentCart = JSON.parse(localStorage.getItem("cart")) || [];

        if (currentCart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        let foodPrice = 0;
        let totalCount = 0;

        currentCart.forEach(item => {
            foodPrice += Number(item.price) * Number(item.qty);
            totalCount += Number(item.qty);
        });

        const orderData = {
            orderId: "#" + Math.floor(Math.random() * 900 + 100),
            totalCount: totalCount,
            foodPrice: foodPrice
        };

        localStorage.setItem("currentOrder", JSON.stringify(orderData));

        // Map / ETA Page သို့ လမ်းကြောင်းညွှန်းမည်
        window.location.href = "/customer/maptest";
    });
}