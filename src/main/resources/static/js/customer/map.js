const orderId = "12345";

// ⚠️ မိမိ Laptop ၏ Local IP Address ကို ပြောင်းလဲထည့်သွင်းပါ
const SERVER_IP = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "localhost"
    : "172.20.10.4";

const restLat = 22.029440;
const restLng = 96.101202;

let destLat = 0, destLng = 0;
let currentRiderLat = restLat, currentRiderLng = restLng;

let map, destMarker, riderMarker, restaurantMarker, routingControl = null;
let stompClient = null;

function initMap() {
    map = L.map('map').setView([restLat, restLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // ဆိုင် Marker (Fixed)
    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    restaurantMarker = L.marker([restLat, restLng], { icon: redIcon }).addTo(map).bindPopup("<b>Restaurant</b>");

    // Rider Marker ကနဦး
    riderMarker = L.marker([restLat, restLng]).addTo(map).bindPopup("Rider (At Store)").openPopup();

    // Customer က မြေပုံပေါ်နှိပ်၍ အိမ်သတ်မှတ်ခြင်း
    map.on('click', function (e) {
        destLat = e.latlng.lat;
        destLng = e.latlng.lng;

        if (destMarker) {
            destMarker.setLatLng([destLat, destLng]);
        } else {
            destMarker = L.marker([destLat, destLng]).addTo(map);
        }
        destMarker.bindPopup("<b>Your Home</b>").openPopup();

        // 💡 Rider ဘက်သို့ Customer အိမ်နေရာ WebSocket ဖြင့် ပို့ပေးခြင်း
        sendCustomerHomeToBackend(destLat, destLng);

        // လမ်းကြောင်းနှင့် အကွာအဝေးကို ချက်ချင်း ပြန်ဆွဲခြင်း
        updateRouteAndETA(currentRiderLat, currentRiderLng);
    });
}

function sendCustomerHomeToBackend(lat, lng) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/customer-home/" + orderId, {}, JSON.stringify({
            latitude: lat,
            longitude: lng
        }));
        console.log("Customer home sent to backend:", lat, lng);
    }
}

function updateRouteAndETA(riderLat, riderLng) {
    currentRiderLat = riderLat;
    currentRiderLng = riderLng;

    if (riderMarker) {
        riderMarker.setLatLng([riderLat, riderLng]);
    }

    if (destLat === 0 || destLng === 0) {
        document.getElementById("eta-text").innerText = "Tap map to set your home first.";
        return;
    }

    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Rider မှ Customer အိမ်သို့ OSRM လမ်းကြောင်းဆွဲခြင်း
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

        riderMarker.bindPopup(`<b>Rider (${durationMin} mins away)</b>`).openPopup();
        document.getElementById("eta-text").innerText = `အကွာအဝေး: ${distanceKm} Km | ရောက်ရန်ကြာချိန်: ${durationMin} mins`;
    });
}

function connectWebSocket() {
    const socket = new SockJS(`http://${SERVER_IP}:8080/ws-tracking`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        document.getElementById("connection-status").innerText = "Connected";
        document.getElementById("connection-status").style.color = "green";

        // Rider Location တက်လာတာ နားထောင်ခြင်း
        stompClient.subscribe('/topic/track/' + orderId, function (response) {
            const riderLocation = JSON.parse(response.body);
            updateRouteAndETA(riderLocation.latitude, riderLocation.longitude);
        });
    }, function (error) {
        document.getElementById("connection-status").innerText = "Connection Failed";
        document.getElementById("connection-status").style.color = "red";
        setTimeout(connectWebSocket, 8080);
    });
}

window.onload = function () {
    initMap();
    connectWebSocket();
};





document.getElementById("statusBtn").addEventListener("click", function () {
    let phoneNumber = document.getElementById("phone");
    if (phoneNumber.value.length == 0) {
        alert("Please fill out your phone number!");
    }
    if (!destLat || !destLng || destLat === 0 || destLng === 0) {
        alert("Please pin your location on the map!");
    }

    else {
        this.innerText = "Pending";
        this.disabled = true;
        map.off('click');

        let currentName = document.getElementById("currentName").value;

        let orderDetails = {
            name: currentName,
            phno: phoneNumber,
            latitude: destLat,
            longitude: destLng
        }

        stompClient.send("/app/new-order"), {}, JSON.stringify(orderDetails);

        // fetch("/api/orders"), {
        //     method: "POST",
        //     headers: {"Content-Type": "application/json"},
        //     body: JSON.stringify({
        //         customerName: "cusA",
        //         phno: phoneNumber,
        //         totalAmount: 100,
        //         totalCount: 1,
        //         distance: 12
        //     })
        // }

    }
})






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