const customers = [];

for(let i=1;i<=2;i++){
            customers.push({id:i, name:"Customer "+i, email:"customer"+i+"@gmail.com"});

    }

const list=document.getElementById("list");

function render(){
    list.innerHTML="";
    customers.forEach((customer,index)=>{
        list.innerHTML+=`
                <div class="customer-row">
                    <div>${customer.name}</div>
                    <div>${customer.email}</div>
                    <div>
                        <button class="delete" onclick="removeItem(${index})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>`;
    });
}
render();

function removeItem(index){
    customers.splice(index,1);
    render();
}

function goHome(){
        window.location.href="/admin/home";
}

function goAdd(){
        window.location.href="add.html";
}