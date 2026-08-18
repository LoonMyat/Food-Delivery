let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(name, price, image){

    let item = cart.find(i => i.name === name);

    if(item){
        item.qty += 1;
    }else{
        cart.push({
            name: name,
            price: Number(price),
            image: image,
            qty: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Item added to cart");  

    // window.location.href = "/customer/cart";
}

// For add Menu

window.onload = function () {

    const menus = JSON.parse(localStorage.getItem("menuList")) || [];

    const foodGrid = document.getElementById("foodGrid");
    const drinkGrid = document.getElementById("drinkGrid");

    menus.forEach(menu => {

        const html = `
        <div class="menu-item">
            <div class="img-placeholder">
                <img src="${menu.image}" alt="${menu.name}">
            </div>

            <p class="name">${menu.name}</p>
            <p class="price">${menu.price}</p>

            <button class="cart-btn"
                onclick="addToCart('${menu.name}','${menu.price}','${menu.image}')">
                Add To Cart
            </button>
        </div>
        `;


    });

};