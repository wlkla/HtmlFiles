let tab_middle = document.querySelector('.tab.middle');
let middle_img = document.getElementById('middle-img');
let allDishesButton = document.getElementById('allDishes')
let specialDishButton = document.getElementById('specialDish');
let dessertButton = document.getElementById('dessert');
let drinkButton = document.getElementById('drink');
let orderButton = document.getElementById('order');
let memberButton = document.getElementById('member')
let confirmButton = document.getElementById('confirmButton');
let closeOrderButton = document.getElementById('closeOrder');
let closeMemberButton = document.getElementById('closeMember');
let monthMember = document.getElementById('month_member');
let quarterMember = document.getElementById('quarter_member');
let yearMember = document.getElementById('year_member');
let selectedDishes = {};
let totalDishes = 0;
let userID;

window.onload = function () {
    fetch('http://localhost:5000/get_current_user_id')
        .then(response => response.json())
        .then(data => {
            userID = data.current_user_id;
        })
        .catch(error => console.error('Error:', error));
};

tab_middle.addEventListener('click', (e) => {
    if (e.target === middle_img || e.target === tab_middle) {
        tab_middle.classList.toggle('open');
        if (tab_middle.classList.contains('open')) {
            middle_img.src = 'images/02.png';
            middle_img.style.transform = 'rotate(360deg)';
        } else {
            middle_img.src = 'images/01.png';
            middle_img.style.transform = 'rotate(0deg)';
        }
    }
});

function getDishes(type) {
    return fetch(`http://localhost:5000/getDishes/${type}`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

function updateQuantity(inputElement, increment, dishName) {
    let quantity = parseInt(inputElement.value, 10);

    if (increment) {
        quantity += 1;
        totalDishes += 1;
    } else if (quantity > 0) {
        quantity -= 1;
        totalDishes -= 1;
    }
    inputElement.value = quantity;

    selectedDishes[dishName] = quantity;
    confirmButton.style.display = totalDishes ? 'block' : 'none';
}

function insertRow(dishes) {
    let table = document.getElementById('menu-table');
    let tbody = table.getElementsByTagName('tbody')[0];

    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    } else {
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
    }

    dishes.forEach(dish => {
        let row = document.createElement('tr');
        let dishNameCell = document.createElement('td');
        let priceCell = document.createElement('td');
        let memberPriceCell = document.createElement('td');
        let quantityCell = document.createElement('td');
        let decreaseButton = document.createElement('button');
        let quantityInput = document.createElement('input');
        let increaseButton = document.createElement('button');

        decreaseButton.style.border = 'none';
        increaseButton.style.border = 'none';
        dishNameCell.textContent = dish.DishName;
        priceCell.textContent = dish.Price;
        memberPriceCell.textContent = dish.MemberPrice;
        decreaseButton.textContent = '-';
        quantityInput.type = 'number';
        quantityInput.min = '0';
        quantityInput.value = selectedDishes[dish.DishName] || '0';
        increaseButton.textContent = '+';

        row.className = 'menu-row';
        dishNameCell.className = 'menu-cell';
        priceCell.className = 'menu-cell';
        memberPriceCell.className = 'menu-cell';
        decreaseButton.className = 'quantity-button-decrease';
        quantityInput.className = 'quantity-input';
        increaseButton.className = 'quantity-button-increase';
        quantityCell.className = 'menu-cell';

        row.appendChild(dishNameCell);
        row.appendChild(priceCell);
        row.appendChild(memberPriceCell);
        quantityCell.appendChild(decreaseButton);
        quantityCell.appendChild(quantityInput);
        quantityCell.appendChild(increaseButton);
        row.appendChild(quantityCell);

        tbody.appendChild(row);

        decreaseButton.addEventListener('click', function () {
            updateQuantity(quantityInput, false, dish.DishName);
        });

        increaseButton.addEventListener('click', function () {
            updateQuantity(quantityInput, true, dish.DishName);
        });
    });
}

function getOrders(id) {
    return fetch(`http://localhost:5000/getOrders/${id}`, {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    })
}

function createOrder() {
    return fetch('http://localhost:5000/createOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userID: userID,
            selectedDishes: selectedDishes,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.json().message);
            }
            return response.json();
        });
}

function showOrder(orders) {
    let content = document.querySelector('.content');
    let contentContainer = document.querySelector('.content-container')

    if ('customerName' in orders && 'sex' in orders) {
        content.innerHTML = `<h1>您的订单</h1><hr><h2>尊敬的${orders.customerName}${orders.sex === '女' ? '小姐' : '先生'}</h2>`;
        content.innerHTML += `<p>您还未在本店点过餐，</p>`;
        content.innerHTML += `<p>快去看看本店有什么好吃的吧！</p>`;
        contentContainer.style.display = 'flex';
    } else {
        content.innerHTML = `<h1>您的订单</h1><hr><h2>尊敬的${orders[0].customerName}${orders[0].sex === '女' ? '小姐' : '先生'}</h2>`;
        orders.forEach((order, index) => {
            let orderHTML = `<h3>第${index + 1}笔订单</h3><h4>下单时间：${order.OrderTime}</h4>`;
            let total = 0;

            order.OrderItems.forEach(item => {
                total += item.Price * item.Quantity;
                if (order.member) {
                    orderHTML += `<p style="display: flex; align-items: center; ">${item.DishName}               - - - - - - - - - - - - - - - - - - -               <span class="unit_price">${item.Price}*${item.Quantity}元</span></p>`;
                } else {
                    orderHTML += `<p style="display: flex; align-items: center; ">${item.DishName}               - - - - - - - - - - - - - - - - - - -               <span>${item.Price}*${item.Quantity}元</span></p>`;
                }
            });
            if (order.member) {
                orderHTML += `<p style="display: flex; align-items: center; ">共计<span class="total_price">${total.toFixed(2)}</span>元</p>`;
            } else {
                orderHTML += `<p style="display: flex; align-items: center; ">- - - - - - -共计<span >${total.toFixed(2)}</span>元</p>`;
            }
            content.innerHTML += orderHTML;
            contentContainer.style.display = 'flex';
        });
    }
}

function purchaseMembership(duration) {
    return fetch(`http://localhost:5000/purchaseMembership/${duration}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            CustomerID: userID,
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

allDishesButton.addEventListener("click", function () {
    getDishes(0).then(dishes => {
        insertRow(dishes);
    }).catch((error) => {
        alert(error.text);
    });
});

specialDishButton.addEventListener("click", function () {
    getDishes(1).then(dishes => {
        insertRow(dishes);
    }).catch((error) => {
        alert(error.text);
    });
});

dessertButton.addEventListener("click", function () {
    getDishes(2).then(dishes => {
        insertRow(dishes);
    }).catch((error) => {
        alert(error.text);
    });
});

drinkButton.addEventListener("click", function () {
    getDishes(3).then(dishes => {
        insertRow(dishes);
    }).catch((error) => {
        alert(error.text);
    });
});

confirmButton.addEventListener('click', function () {
    createOrder()
        .then(data => {
            if (data.message === 'Success!') {
                selectedDishes = {};
                totalDishes = 0;
                allDishesButton.click();
                confirmButton.style.display = 'none';
                alert("订单提交成功");
            } else {
                alert("订单提交失败");
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('出错了：' + error.message);
        });
});

orderButton.addEventListener("click", function () {
    getOrders(userID).then(orders => {
        showOrder(orders);
    }).catch((error) => {
        alert(error.text);
    });
});

closeOrderButton.addEventListener('click', function () {
    let contentContainer = document.querySelector('.content-container')
    contentContainer.style.display = 'none';
})

memberButton.addEventListener('click', function () {
    let memberContainer = document.querySelector('.member_container');
    memberContainer.style.display = 'flex';
})

closeMemberButton.addEventListener('click', function () {
    let memberContainer = document.querySelector('.member_container');
    memberContainer.style.display = 'none';
})

monthMember.addEventListener("click", function () {
    purchaseMembership('month').then(result => {
        alert("购买成功！")
        let memberContainer = document.querySelector('.member_container');
        memberContainer.style.display = 'none';
    }).catch((error) => {
        alert(error.text);
    });
});

quarterMember.addEventListener("click", function () {
    purchaseMembership('quarter').then(result => {
        alert("购买成功！")
        let memberContainer = document.querySelector('.member_container');
        memberContainer.style.display = 'none';
    }).catch((error) => {
        alert(error.text);
    });
});

yearMember.addEventListener("click", function () {
    purchaseMembership('year').then(result => {
        alert("购买成功！")
        let memberContainer = document.querySelector('.member_container');
        memberContainer.style.display = 'none';
    }).catch((error) => {
        alert(error.text);
    });
});
