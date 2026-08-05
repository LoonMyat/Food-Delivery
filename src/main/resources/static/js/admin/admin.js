let riderList = JSON.parse(localStorage.getItem("riders")) || [];

const list = document.getElementById("list");

function render() {
    list.innerHTML = "";

    riderList.forEach((item, index) => {
        let riderrow = document.createElement("div");
        riderrow.className = "riderrow";

        riderrow.innerHTML = `
            <div>${item.name}</div>
            <div>${item.email}</div>
            <div>${item.phone}</div>
            <div>
                <button class="riderdeleteBtn" onclick="deleteRow(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        list.appendChild(riderrow);
    });
}

function deleteRow(index) {
    riderList.splice(index, 1);
    localStorage.setItem("riders", JSON.stringify(riderList));
    render();
}

render();

document.querySelector(".rideraddBtn").onclick = function() {
    window.location.href = "/admin/add_rider";
};

document.querySelector(".back").onclick = function() {
    window.location.href = "/admin/home";
};