let stompClient = null;
let ridersList = [];

// Fetch available riders
async function loadRiders() {
    try {
        const response = await fetch('/api/riders');
        ridersList = await response.json();
        console.log("Riders loaded:", ridersList);
    } catch (error) {
        console.error("Error loading riders:", error);
    }
}

// Fetch active orders from db
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

// Create order cards
// Create or Update order cards
function renderOrderCard(order) {
    const notiContainer = document.getElementById("noti");
    if (!notiContainer) return;

    let cardElem = document.getElementById("order-card-" + order.id);

    // 💡 အကယ်၍ Order က DELIVERED ဖြစ်သွားရင် Card ကို ချက်ချင်း ဖယ်ရှားမည်
    if (order.status === "DELIVERED") {
        if (cardElem) {
            cardElem.remove();
        }
        return;
    }

    // 💡 Card က ရှိပြီးသားဆိုရင် အဟောင်းကိုဖျက်ပြီး အသစ်နဲ့ အစားထိုးရန် (Status နဲ့ Select တွေ အချိန်နဲ့တပြေးညီ ပြောင်းလဲစေရန်)
    if (cardElem) {
        cardElem.remove();
    }

    var info = document.createElement("div");
    info.className = "order-card";
    info.id = "order-card-" + order.id;

    let btnText = "Accept";
    let isRejectDisabled = "";
    let isSelectDisabled = "";

    if (order.status === "PREPARING" || order.status === "ACCEPTED") {
        btnText = "Ready to pick up";
        isRejectDisabled = "disabled";
        isSelectDisabled = "disabled"; // Select box ကို Disable လုပ်မည်
    } else if (order.status === "READY_FOR_PICKUP" || order.status === "READY_TO_PICKUP") {
        btnText = "Picked Up";
        isRejectDisabled = "disabled";
        isSelectDisabled = "disabled";
    } else if (order.status === "ON_THE_WAY") {
        btnText = "Delivering";
        isRejectDisabled = "disabled";
        isSelectDisabled = "disabled";
    }

    let riderOptions = `<option value="" disabled selected>Select Rider</option>`;

    ridersList.forEach(rider => {
        let isSelected = (order.rider && order.rider.id === rider.id) ? "selected" : "";
        riderOptions += `<option value="${rider.id}" ${isSelected}>${rider.user.username}</option>`;
    });

    let currentRiderId = order.rider ? order.rider.id : "";

    info.innerHTML = `
        <p><strong>Order ID:</strong> #${String(order.id).padStart(3, '0')}</p>
        <p><strong>Customer:</strong> ${order.cusName || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total amount:</strong> ${Number(order.totalAmount || 0).toLocaleString()} MMK</p>
        
        <select name="rider" id="rider-${order.id}" data-assigned-rider="${currentRiderId}" ${isSelectDisabled} required>
            ${riderOptions}
        </select>
        
        <button onclick="rejectOrder(${order.id})" ${isRejectDisabled} class="rejectBtn">Reject</button>
        <button onclick="acceptOrder(${order.id}, this)" class="statusBtn">${btnText}</button>
    `;

    notiContainer.prepend(info);
}
// Reject Order
function rejectOrder(orderId) {
    if (confirm("Are you sure you want to reject this order?")) {
        if (stompClient && stompClient.connected) {
            stompClient.send("/app/reject-order", {}, JSON.stringify({ orderId: Number(orderId) }));

            const cardElem = document.getElementById("order-card-" + orderId);
            if (cardElem) {
                cardElem.remove();
            }
        }
    }
}

// Connect websocket
function connectWebSocket() {
    const socket = new SockJS("/ws"); 
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected to WebSocket: " + frame);

        stompClient.subscribe('/topic/admin/orders', function(message) {
            var order = JSON.parse(message.body);
            
            // 💡 ဤနေရာတွင် DELIVERED ဖြစ်လျှင် ကဒ်ကို ချက်ချင်း ဖယ်ရှားရန် ထည့်ပါ
            if (order.status === "DELIVERED") {
                const cardElem = document.getElementById("order-card-" + order.id);
                if (cardElem) {
                    cardElem.remove();
                }
                return; // Card အသစ် ဆက်မဆောက်တော့ပါ
            }

            // အခြား status များအတွက်မူ ပုံမှန်အတိုင်း Card အသစ်ဆောက်မည် (သို့ အပ်ဒိတ်လုပ်မည်)
            renderOrderCard(order);
        });
    }, function(error) {
        console.error("WebSocket Error: ", error);
        setTimeout(connectWebSocket, 5000);
    });
}

// Accept order
function acceptOrder(orderId, btnElement) {
    if (!stompClient || !stompClient.connected) {
        alert("WebSocket is not connected!");
        return;
    }

    const currentText = btnElement.innerText.trim();
    const riderSelect = document.getElementById(`rider-${orderId}`);

    // 💡 Get and safely parse riderId to Number, if exists
    let selectedRiderId = null;
    if (riderSelect) {
        if (!riderSelect.disabled && riderSelect.value) {
            selectedRiderId = Number(riderSelect.value);
        } else {
            selectedRiderId = Number(riderSelect.getAttribute('data-assigned-rider')) || null;
        }
    }

    // Fallback: if select is disabled and value is empty, try to get it from order if needed, or send existing
    if ((!selectedRiderId || isNaN(selectedRiderId)) && currentText !== "Accept") {
        // If select is disabled, we can pass null or 0 since rider is already assigned
        selectedRiderId = null;
    }

    if (currentText === "Accept") {
        if (!selectedRiderId || isNaN(selectedRiderId)) {
            alert("Please select a rider first!");
            return;
        }

        stompClient.send("/app/accept-order", {}, JSON.stringify({
            orderId: Number(orderId),
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
            if (riderSelect) riderSelect.disabled = true; // disable select after accept
        }

    }

    else if (currentText === "Ready to pick up") {
        stompClient.send("/app/accept-order", {}, JSON.stringify({
            orderId: Number(orderId),
            riderId: selectedRiderId,
            status: "READY_FOR_PICKUP"
        }));

        if (btnElement) {
            btnElement.innerText = "Picked Up";
        }
    }

    else if (currentText === "Picked Up") {
        stompClient.send("/app/accept-order", {}, JSON.stringify({
            orderId: Number(orderId),
            riderId: selectedRiderId,
            status: "PICKED_UP"
        }));

        if (btnElement) {
            btnElement.innerText = "Delivering";
            btnElement.disabled = true;
        }
    }
}

function goToPage(page) {
    window.location.href = page;
}

window.onload = async function () {
    await loadRiders();
    loadActiveOrders();
    connectWebSocket();
};