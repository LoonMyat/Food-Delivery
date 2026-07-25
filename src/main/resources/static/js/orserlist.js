const orderList = document.getElementById("orderList");

for(let i=1;i<=2;i++){

    const item=document.createElement("div");

    item.className="order-row";

    item.innerHTML=`
        <span>#${i}</span>
        <span>11 Jul 2026</span>
        <span>Customer ${i}</span>
        <span class="status">Pending</span>`
    ;

    orderList.appendChild(item);

}