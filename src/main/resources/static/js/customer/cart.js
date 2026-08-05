// =========================
// Load Cart
// =========================
console.log("cart.js loaded")
let cart = JSON.parse(localStorage.getItem("cart")) || [];
console.log(cart);
const cartItems = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");


// =========================
// Display Cart
// =========================

function displayCart(){

    console.log(cartItems);
console.log(totalPrice);

    cartItems.innerHTML = "";

    let total = 0;

    if(cart.length === 0){

        cartItems.innerHTML = `
            <h2 style="text-align:center;color:#750608;">
                Your Cart is Empty
            </h2>
        `;

        totalPrice.innerHTML = "0 MMK";
        return;
    }

    cart.forEach((item,index)=>{

    console.log(item);

    const card = document.createElement("div");
    card.className = "cart-card";

    card.innerHTML = `
        <div class="cart-left">
            <img src="${item.image}" alt="">
            <div class="food-info">
                <h3>${item.name}</h3>
                <p>${item.price} MMK</p>
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
// Increase
// =========================

function increaseQty(index){

    cart[index].qty++;

    saveCart();

}


// =========================
// Decrease
// =========================

function decreaseQty(index){

    cart[index].qty--;

    if(cart[index].qty <= 0){

        cart.splice(index,1);

    }

    saveCart();

}


// =========================
// Save
// =========================

function saveCart(){

    localStorage.setItem("cart",JSON.stringify(cart));

    displayCart();

}


// =========================
// Start
// =========================

displayCart();

// FOR customer_order.js

document.getElementById("orderBtn").addEventListener("click", function () {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let foodPrice = 0;
    let totalCount = 0;

    cart.forEach(item => {
        foodPrice += item.price * item.qty;
        totalCount += item.qty;
    });

    const deliveryFee = 2000;

    const orderData = {
        orderId: "#" + Math.floor(Math.random() * 900 + 100),
        totalCount,
        foodPrice,
        deliveryFee,
        totalAmount: foodPrice + deliveryFee
    };

    localStorage.setItem("currentOrder", JSON.stringify(orderData));

    window.location.href = "/customer/maptest";
});





















// document.getElementById("orderForm").addEventListener("submit", function (e) {
//             e.preventDefault();
//             fetch("/api/orders", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     customerName: document.getElementById("cusName").value,
//                     itemName: document.getElementById("itemName").value,
//                     quantity: document.getElementById("quantity").value
//                 })
//             }).then(res => res.json())
//                 .then(data => alert("Order submitted successfully!"));
//         });
//         var socket = new SockJS('/ws');
//         var stompClient = Stomp.over(socket);

//         stompClient.connect({}, function(frame) {
//             stompClient.subscribe('/topic/orders', function(message) {
//                 var order = JSON.parse(message.body);

//                 var row = document.createElement("tr");
//                 row.innerHTML = `
//                     <td>${order.id}</td>
//                     <td>${order.customerName}</td>
//                     <td>${order.itemName}</td>
//                     <td>${order.quantity}</td>
//                     <td>${order.status}</td>
//                     <td>${order.orderDate}</td>
//                 `;
//                 document.getElementById("ordersTable").appendChild(row);
//             });
//         });