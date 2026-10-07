// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================
let tempOrderId = null;
let orderId = null;
let stompClient = null;

let statusSubscription = null;
let trackSubscription = null;

const savedActiveOrderId = localStorage.getItem("activeOrderId");
const savedOrderState = JSON.parse(localStorage.getItem("activeOrderState"));

let currentOrder = null;

if (savedActiveOrderId && savedOrderState && savedOrderState.orderData) {
    currentOrder = savedOrderState.orderData; // Confirm ပြီးသား Order Data
} else {
    currentOrder = JSON.parse(localStorage.getItem("currentOrder"));
}
if (currentOrder) {
    const foodPriceElem = document.getElementById("foodPrice");
    const totalCountElem = document.getElementById("totalCount");
    if (foodPriceElem) foodPriceElem.innerHTML = `${currentOrder.foodPrice} MMK`;
    if (totalCountElem) totalCountElem.innerHTML = `${currentOrder.totalCount}`;
}

// Restaurant Coordinates
const restLat = 22.029440;
const restLng = 96.101202;

let destLat = 0, destLng = 0;
let currentRiderLat = restLat, currentRiderLng = restLng;

let map, destMarker, riderMarker, restaurantMarker, routingControl = null;

const SERVER_IP = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "localhost"
    : "172.20.10.4";


// ==========================================
// 2. WEBSOCKET CONNECTION
// ==========================================
function connectWebSocket() {
    const socket = new SockJS(`http://${SERVER_IP}:8080/ws`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log("Connected to WebSocket: " + frame);

        // fetch db response for actual order id
        stompClient.subscribe('/topic/order-response', function (response) {
            const savedOrder = JSON.parse(response.body);

            if (tempOrderId && savedOrder.tempOrderId === tempOrderId) {
                orderId = savedOrder.id; // DB Order ID 
                console.log("✅ Order matched! Assigned DB Order ID:", orderId);

                localStorage.setItem("activeOrderId", orderId);

                let displayElem = document.getElementById("displayOrderId");
                if (displayElem) displayElem.innerText = "#" + orderId;

                trackRiderLocation(orderId);
                listenOrderStatus(orderId);
                sendCustomerHomeToBackend(destLat, destLng);
            }
        });

    }, function (error) {
        console.error("WebSocket Connection Error: ", error);
        setTimeout(connectWebSocket, 5000);
    });
}


// ==========================================
// 3. LISTEN TO ORDER STATUS UPDATES
// ==========================================
function listenOrderStatus(assignedOrderId) {
    console.log("Subscribing to status updates for Order:", assignedOrderId);

    if (statusSubscription) statusSubscription.unsubscribe();

    statusSubscription = stompClient.subscribe('/topic/customer/' + assignedOrderId, function (response) {
        const data = JSON.parse(response.body);
        console.log("Received Status Update:", data);

        if (data && data.status) {
            updateStatusUI(data.status);
        }
    });
}

function updateStatusUI(status) {
    let statusBtn = document.getElementById("statusBtn");
    if (!statusBtn || !status) return;

    const currentStatus = status.toUpperCase();

    if (currentStatus === "PENDING") {
        statusBtn.innerText = "Pending";
        statusBtn.style.backgroundColor = "#ffc107"; // Yellow
        statusBtn.disabled = true;
    }
    else if (currentStatus === "PREPARING" || currentStatus === "ACCEPTED") {
        statusBtn.innerText = "Preparing meals";
        statusBtn.style.backgroundColor = "#ff9800"; // Orange
        statusBtn.disabled = true;
    }
    else if (currentStatus === "READY_FOR_PICKUP" || currentStatus === "READY_TO_PICKUP" || currentStatus === "READY") {
        statusBtn.innerText = "Ready for Pick Up";
        statusBtn.style.backgroundColor = "#28a745"; // Green
        statusBtn.disabled = true;
    }
    else if (currentStatus === "ON_THE_WAY") {
        statusBtn.innerText = "On the Way";
        statusBtn.style.backgroundColor = "#17a2b8"; // Blue
        statusBtn.disabled = true;
    }
    else if (currentStatus === "DELIVERED") {
        statusBtn.innerText = "Delivered 🎉";
        statusBtn.style.backgroundColor = "#6c757d";
        statusBtn.disabled = true;

        // remove locatStroage when delivered
        localStorage.removeItem("activeOrderId");
        localStorage.removeItem("currentOrder");
        localStorage.removeItem("activeOrderState");
        localStorage.removeItem("cart");

        setTimeout(() => {
            alert("Order arrived successfully!");
            window.location.href = "/customer/home";
        }, 500);
    }
    else if (currentStatus === "REJECTED") {
        alert("Sorry! Your order has been rejected.");
        statusBtn.innerText = "Confirm Order";
        statusBtn.disabled = false;
        statusBtn.style.backgroundColor = "";

        localStorage.removeItem("activeOrderId");
        localStorage.removeItem("activeOrderState"); 
        orderId = null;
        enableMapClick();
    }
}


// ==========================================
// 4. TRACK RIDER LOCATION & SEND CUSTOMER HOME
// ==========================================
function trackRiderLocation(assignedOrderId) {
    
    if (!stompClient || !stompClient.connected) {
        console.error("WebSocket not connected!");
        return;
    }

    if (trackSubscription) {
        trackSubscription.unsubscribe();
    }

    const topic = '/topic/track/' + assignedOrderId;
    
    
    console.log("Listening to: " + topic);

    trackSubscription = stompClient.subscribe(topic, function (response) {
        console.log("Data received from Backend: ", response.body);
        
        
        try {
            const riderLocation = JSON.parse(response.body);

            if (riderLocation && riderLocation.latitude && riderLocation.longitude) {
                updateRouteAndETA(riderLocation.latitude, riderLocation.longitude);
            } else {
                console.warn("Lat, Lng not found!", riderLocation);
            }
        } catch (error) {
            console.error("Error", error);
        }
    });
}

function sendCustomerHomeToBackend(lat, lng) {
    if (stompClient && stompClient.connected && orderId) {
        stompClient.send("/app/customer-home/" + orderId, {}, JSON.stringify({
            latitude: lat,
            longitude: lng
        }));
        console.log("Customer home sent to backend for Order:", orderId);
    }
}


// ==========================================
// 5. LEAFLET MAP & ROUTING LOGIC
// ==========================================
function initMap() {
    map = L.map('map').setView([restLat, restLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    restaurantMarker = L.marker([restLat, restLng], { icon: redIcon }).addTo(map).bindPopup("<b>Restaurant</b>");
    // riderMarker = L.marker([restLat, restLng]).addTo(map).bindPopup("Rider (At Store)").openPopup();

    enableMapClick();
}

function onMapClick(e) {
    destLat = e.latlng.lat;
    destLng = e.latlng.lng;

    if (destMarker) {
        destMarker.setLatLng([destLat, destLng]);
    } else {
        destMarker = L.marker([destLat, destLng]).addTo(map);
    }
    destMarker.bindPopup("<b>Your Home</b>").openPopup();

    if (orderId) {
        sendCustomerHomeToBackend(destLat, destLng);
    }
    updateRouteAndETA(currentRiderLat, currentRiderLng);
}

function enableMapClick() {
    if (map) {
        map.off('click', onMapClick);
        map.on('click', onMapClick);
    }
}

let deliFee = 0;
function calculateTotalAmount(distance, amount) {
    let total = 0;
    if (distance <= 5) deliFee = 1000;
    else if (distance <= 10) deliFee = 2000;
    else if (distance <= 20) deliFee = 3000;
    else deliFee = 3500;

    total = deliFee + amount;
    return total;
}

let total = 0;

function updateRouteAndETA(riderLat, riderLng) {
    currentRiderLat = riderLat;
    currentRiderLng = riderLng;

    let riderLatLng = [riderLat, riderLng]; 

    if (riderMarker) {
        // Marker ရှိနေလျှင် နေရာရွှေ့မည်
        riderMarker.setLatLng(riderLatLng); 
    } else {
        // Marker မရှိသေးလျှင် အသစ်တည်ဆောက်မည်
        riderMarker = L.marker(riderLatLng)
            .addTo(map)
            .bindPopup("<b>Rider</b>"); 
    }
    // if (riderMarker) riderMarker.setLatLng([riderLat, riderLng]);
    if (destLat === 0 || destLng === 0) return;

    if (!routingControl) {
        routingControl = L.Routing.control({
            waypoints: [L.latLng(riderLat, riderLng), L.latLng(destLat, destLng)],
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
            lineOptions: { styles: [{ color: 'blue', opacity: 0.8, weight: 6 }] },
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: function () { return null; }
        }).addTo(map);

        routingControl.on('routesfound', function (e) {
            const summary = e.routes[0].summary;
            const distanceKm = (summary.totalDistance / 1000).toFixed(2);
            const durationMin = Math.round(summary.totalTime / 60);

            if (currentOrder && currentOrder.foodPrice) {
                total = calculateTotalAmount(distanceKm, currentOrder.foodPrice);
                const deliFeeElem = document.getElementById("deliveryFee");
                if (deliFeeElem) deliFeeElem.innerHTML = `${deliFee} MMK`;
            }

            riderMarker.bindPopup(`<b>Rider (${durationMin} mins away)</b>`).openPopup();

            const etaElem = document.getElementById("eta");
            const distanceElem = document.getElementById("distance");
            const totalAmountElem = document.getElementById("totalAmount");

            if (etaElem) {
                etaElem.innerText = (durationMin >= 4) ? `${durationMin * 2} mins` : `${durationMin} mins`;
            }
            if (distanceElem) {
                distanceElem.innerText = `${distanceKm} km`;
            }
            if (totalAmountElem) {
                totalAmountElem.innerText = `${total.toLocaleString()} MMK`;
            }
        });
    } else {
        routingControl.setWaypoints([
            L.latLng(riderLat, riderLng),
            L.latLng(destLat, destLng)
        ]);
    }
}


// ==========================================
// 6. ORDER SUBMISSION & INITIALIZATION
// ==========================================
window.onload = function () {
    initMap();
    connectWebSocket();

    const savedActiveOrderId = localStorage.getItem("activeOrderId");
    const savedOrderState = JSON.parse(localStorage.getItem("activeOrderState"));

    if (savedActiveOrderId && savedOrderState) {
        destLat = savedOrderState.destLat;
        destLng = savedOrderState.destLng;
        total = savedOrderState.total;
        deliFee = savedOrderState.deliFee;

        if (savedOrderState.orderData) {
            currentOrder = savedOrderState.orderData;
            const foodPriceElem = document.getElementById("foodPrice");
            const totalCountElem = document.getElementById("totalCount");
            if (foodPriceElem) foodPriceElem.innerHTML = `${currentOrder.foodPrice} MMK`;
            if (totalCountElem) totalCountElem.innerHTML = `${currentOrder.totalCount}`;
        }
        
        if (destLat && destLng) {
            if (destMarker) map.removeLayer(destMarker);
            destMarker = L.marker([destLat, destLng]).addTo(map).bindPopup("<b>Your Home</b>").openPopup();
            updateRouteAndETA(currentRiderLat, currentRiderLng);
        }

        const phoneElem = document.getElementById("phone");
        if (phoneElem && savedOrderState.phone) {
            phoneElem.value = savedOrderState.phone;
        }

        const deliFeeElem = document.getElementById("deliveryFee");
        const totalAmountElem = document.getElementById("totalAmount");
        if (deliFeeElem && deliFee) deliFeeElem.innerHTML = `${deliFee} MMK`;
        if (totalAmountElem && total) totalAmountElem.innerText = `${total.toLocaleString()} MMK`;
    }

    if (savedActiveOrderId) {
        orderId = savedActiveOrderId;

        let displayElem = document.getElementById("displayOrderId");
        if (displayElem) displayElem.innerText = "#" + orderId;

        if (map) map.off('click', onMapClick); 

        
        fetch(`http://${SERVER_IP}:8080/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.status) {
                    updateStatusUI(data.status);
                }
            })
            .catch(err => console.error("Error fetching order status:", err));

        
        setTimeout(() => {
            if (stompClient && stompClient.connected) {
                listenOrderStatus(orderId);
                trackRiderLocation(orderId);
            }
        }, 1000);
    }

    const statusBtn = document.getElementById("statusBtn");
    if (statusBtn) {
        statusBtn.addEventListener("click", function () {
            if (!destLat || !destLng || destLat === 0 || destLng === 0) {
                alert("Please pin your location on the map!");
                return;
            }

            const phoneElem = document.getElementById("phone");
            let phoneNumber = phoneElem.value.trim();

            if (!phoneNumber) {
                alert("Please enter your phone number");
                return;
            }

            tempOrderId = "TEMP_" + Date.now();

            
            const orderStateToSave = {
                destLat: destLat,
                destLng: destLng,
                phone: phoneNumber,
                total: total,
                deliFee: deliFee,
                orderData: {
                    foodPrice: currentOrder ? currentOrder.foodPrice : 0,
                    totalCount: currentOrder ? currentOrder.totalCount : 0
                }
            };
            localStorage.setItem("activeOrderState", JSON.stringify(orderStateToSave));

            updateStatusUI("PENDING");
            if (map) map.off('click', onMapClick);

            const nameElem = document.getElementById("currentName");
            let currentName = nameElem ? nameElem.value : "Customer";

            let orderDetails = {
                tempOrderId: tempOrderId,
                cusName: currentName,
                phone: phoneNumber,
                latitude: destLat,
                longitude: destLng,
                totalAmount: total
            };

            stompClient.send("/app/new-order", {}, JSON.stringify(orderDetails));
        });
    }
};