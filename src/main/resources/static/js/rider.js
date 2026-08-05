function goToPage(page) {
  window.location.href = page;
}

function initMap() {
  // Replace with real coordinates
  const restaurant = [22.031463, 96.102618]; 
  // --- WebSocket connection ---
const socket = new SockJS("http://localhost:8080/ws");
const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {
  // Subscribe to new orders
  stompClient.subscribe("/topic/orders", (message) => {
    const order = JSON.parse(message.body);
    console.log("New order:", order);

    // Accept the order
    stompClient.send("/app/accept", {}, JSON.stringify(order));

    // Start sending rider GPS updates
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          order.riderLat = pos.coords.latitude;
          order.riderLng = pos.coords.longitude;

          stompClient.send("/app/rider-location", {}, JSON.stringify(order));
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
});
 

  const map = L.map('map').setView(restaurant, 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
 
  // Restaurant marker (fixed)
  const restaurantMarker = L.marker(restaurant).addTo(map).bindPopup("Restaurant");

  // Customer marker (fixed)
  const customerMarker = L.marker(customer).addTo(map).bindPopup("Customer");

  // Rider marker (updates with GPS)
  const riderMarker = L.marker(restaurant).addTo(map).bindPopup("Rider");

  // Routing Machine: street-based path
  const control = L.Routing.control({
    waypoints: [
      L.latLng(restaurant[0], restaurant[1]),
      L.latLng(customer[0], customer[1])
    ],
    routeWhileDragging: false,
    lineOptions: {
      styles: [{ color: 'orange', weight: 4 }]
    },
    createMarker: () => null, // prevent auto markers
    show: false
  }).addTo(map);

  // Update distance & duration
  control.on('routesfound', function(e) {
    const route = e.routes[0];
    const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
    const durationMin = Math.round(route.summary.totalTime / 60);

    document.getElementById("distance").innerText = `Distance: ${distanceKm} km`;
    document.getElementById("duration").innerText = `Estimated Time: ${durationMin} mins`;
  });

  // Track rider GPS
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        riderMarker.setLatLng([lat, lng]); // stays exact at GPS lat/lng
        map.setView([lat, lng], map.getZoom()); // keep zoom level
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
}

if (document.getElementById("map")) {
  initMap();
}
