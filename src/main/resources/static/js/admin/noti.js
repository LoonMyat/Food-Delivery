let stompClient = null;
let ridersList = []; 

// 💡 1. DB ထဲမှ Rider List ကို Fetch လုပ်မည်
async function loadRiders() {
    try {
        const response = await fetch('/api/riders');
        ridersList = await response.json();
        console.log("Riders loaded:", ridersList);
    } catch (error) {
        console.error("Error loading riders:", error);
    }
}

// 💡 2. DB ထဲမှ ရှိပြီးသား Active Orders များကို Fetch လုပ်ယူမည်
function loadActiveOrders() {
    fetch('/api/orders/active')
        .then(response => response.json())
        .then(orders => {
            const notiContainer = document.getElementById("noti");
            if (notiContainer) {
                notiContainer.innerHTML = "";
            }
            orders.forEach(order => {
                renderOrderCard(order);
            });
        })
        .catch(error => console.error("Error fetching active orders:", error));
}

// 💡 3. Order Card ဖန်တီးပေးမည့် Reusable Function
function renderOrderCard(order) {
    const notiContainer = document.getElementById("noti");
    if (!notiContainer) return;

    if (document.getElementById("order-card-" + order.id)) {
        return;
    }

    // Backend (API / WebSocket) မှ ပါလာသော phone နံပါတ်ကို တိုက်ရိုက်ယူသုံးခြင်း
    const phoneNum = order.phone ? order.phone : "N/A";

    var info = document.createElement("div");
    info.className = "order-card";
    info.id = "order-card-" + order.id;

    let btnText = "Accept";
    let isRejectDisabled = "";

    if (order.status === "PREPARING" || order.status === "ACCEPTED") {
        btnText = "Ready to pick up";
        isRejectDisabled = "disabled";
    } else if (order.status === "READY_FOR_PICKUP" || order.status === "READY_TO_PICKUP") {
        btnText = "Picked Up";
        isRejectDisabled = "disabled";
    }

    let riderOptions = `<option value="" disabled selected>Select Rider</option>`;
    
    ridersList.forEach(rider => {
        let isSelected = (order.rider && order.rider.id === rider.id) ? "selected" : "";
        riderOptions += `<option value="${rider.id}" ${isSelected}>${rider.user.username}</option>`;
    });

    info.innerHTML = `
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Customer:</strong> ${order.cusName || 'N/A'}</p>
        <p><strong>Phone:</strong> ${phoneNum}</p>
        <p><strong>Total amount:</strong> ${Number(order.totalAmount || 0).toLocaleString()} MMK</p>
        
        <select name="rider" id="rider-${order.id}" required>
            ${riderOptions}
        </select>
        
        <button onclick="rejectOrder(${order.id})" ${isRejectDisabled} class="rejectBtn">Reject</button>
        <button onclick="acceptOrder(${order.id}, this)" class="statusBtn">${btnText}</button>
    `;

    notiContainer.prepend(info);
}

// 💡 4. Reject Order
function rejectOrder(orderId) {
    if (confirm("Are you sure you want to reject this order?")) {
        if (stompClient && stompClient.connected) {
            stompClient.send("/app/reject-order", {}, JSON.stringify({ orderId: orderId }));

            const cardElem = document.getElementById("order-card-" + orderId);
            if (cardElem) {
                cardElem.remove();
            }
        }
    }
}

// 💡 5. Real-time WebSocket ချိတ်ဆက်ခြင်း
function connectWebSocket() {
    const socket = new SockJS("/ws"); 
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected to WebSocket: " + frame);

        stompClient.subscribe('/topic/admin/orders', function(message) {
            var order = JSON.parse(message.body);
            renderOrderCard(order);
        });
    }, function(error) {
        console.error("WebSocket Error: ", error);
        setTimeout(connectWebSocket, 5000);
    });
}

// 💡 6. Accept & Ready Action Handler
function acceptOrder(orderId, btnElement) {
    if (!stompClient || !stompClient.connected) {
        alert("WebSocket is not connected!");
        return;
    }

    const currentText = btnElement.innerText.trim();
    const riderSelect = document.getElementById(`rider-${orderId}`);
    const selectedRiderId = riderSelect ? riderSelect.value : null;

    // 1. "Accept" နှိပ်လိုက်ချိန် ➔ Status: ACCEPTED
    if (currentText === "Accept") {
        if (!selectedRiderId) {
            alert("Please select a rider first!");
            return;
        }

        stompClient.send("/app/accept-order", {}, JSON.stringify({ 
            orderId: orderId,
            riderId: selectedRiderId,
            status: "ACCEPTED"
        }));

        if (btnElement) {
            btnElement.innerText = "Ready to pick up";
        }
        
        const cardElem = document.getElementById("order-card-" + orderId);
        if (cardElem) {
            const rejectBtn = cardElem.querySelector(".rejectBtn");
            if (rejectBtn) rejectBtn.disabled = true;
        }

    } 
    // 2. "Ready to pick up" နှိပ်လိုက်ချိန် ➔ Status: READY_FOR_PICKUP
    else if (currentText === "Ready to pick up") {
        stompClient.send("/app/accept-order", {}, JSON.stringify({ 
            orderId: orderId,
            riderId: selectedRiderId,
            status: "READY_FOR_PICKUP"
        }));

        if (btnElement) {
            btnElement.innerText = "Picked Up";
        }
    }

    else if (currentText == "Picked Up") {
        stompClient.send("/app/accept-order", {}, JSON.stringify({
            orderId: orderId,
            riderId: selectedRiderId,
            status: "PICKED_UP"
        }));

        if(btnElement){
            btnElement.innerText = "Delivering";
            btnElement.disabled = true;
        }
    }
}

function goToPage(page){
    window.location.href = page;
}

// 💡 7. Page Start Initialization
window.onload = async function() {
    await loadRiders();     
    loadActiveOrders();   
    connectWebSocket();   
};