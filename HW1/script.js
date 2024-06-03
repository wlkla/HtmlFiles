// 背景动画
let text = document.getElementById('text');
let leaf = document.getElementById('leaf');
let hill1 = document.getElementById('hill1');
let hill4 = document.getElementById('hill4');
let hill5 = document.getElementById('hill5');

window.addEventListener('scroll', () => {
    let value = window.scrollY;

    text.style.marginTop = value * 1.5 + 'px';
    leaf.style.top = value * -1.5 + 'px';
    leaf.style.left = value * 1.5 + 'px';
    hill5.style.left = value * 1.5 + 'px';
    hill4.style.left = value * -1.5 + 'px';
    hill1.style.top = value * 0.5 + 'px';
});

function updateRadios() {
    let radios = document.querySelectorAll('.id-radio');
    radios.forEach(radio => {
        radio.addEventListener('change', function () {
            radios.forEach(r => {
                if (r.checked) {
                    r.nextElementSibling.style.display = 'none';
                    editButton.style.display = 'inline';
                    deleteButton.style.display = 'inline';
                } else {
                    r.nextElementSibling.style.display = 'inline';
                }
            });
            if (!Array.from(radios).some(radio => radio.checked)) {
                editButton.style.display = 'none';
                deleteButton.style.display = 'none';
            }
        });
    });
}

// 获取所有菜品
function getMenuFromDatabase() {
    return fetch('http://localhost:5000/get_menu', {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

window.addEventListener("load", function () {
    getMenuFromDatabase().then(menu => {
        let table = document.getElementById("data-table");
        let rows = table.getElementsByTagName("tr");
        for (let i = 0; i < menu.length; i++) {
            let dish = menu[i];
            let emptyRow = Array.from(rows).find(row => row.cells[1].innerText === "");
            if (emptyRow) {
                emptyRow.cells[1].innerText = dish[1];
                emptyRow.cells[2].innerText = dish[2];
                emptyRow.cells[3].innerText = dish[3];
            } else {
                let row = table.insertRow();
                row.innerHTML = `
                    <td>
                        <label for="id${rows.length - 1}"></label><input type="radio" class="id-radio" id="id${rows.length - 1}" name="id-radio-group" value="${rows.length - 1}" onclick="updateRadios()">
                        <span class="id-number">${rows.length - 1}</span>
                    </td>
                    <td>${dish[1]}</td>
                    <td>${dish[2]}</td>
                    <td>${dish[3]}</td>
                `;
            }
        }
    }).catch((error) => {
        alert("获取菜单失败");
    });
});

// 添加菜品
let addForm = document.getElementById("addForm");
let dishName = document.getElementById("dishName");
let price = document.getElementById("price");
let memberPrice = document.getElementById("memberPrice");
let addButton = document.getElementById("add");
let modal = document.getElementById("myModal");
let closeButton = document.querySelector(".close");
let isEditing = false;
let currentDishID = null;

addButton.addEventListener("click", function () {
    modal.style.display = "block";
    dishName.value = "";
    price.value = "";
    memberPrice.value = "";
    isEditing = false;
});

closeButton.addEventListener("click", function () {
    modal.style.display = "none";
});

function addDishToDatabase(dish) {
    return fetch('http://localhost:5000/add_dish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dish),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

addForm.addEventListener("submit", function (event) {
    event.preventDefault();

    editButton.style.display = 'none';
    deleteButton.style.display = 'none';

    if (typeof dishName.value !== "string" || dishName.value.trim() === "") {
        alert("Dish Name must be a string.");
        return;
    }

    if (isNaN(price.value) || price.value.trim() === "") {
        alert("Price must be a number.");
        return;
    }

    if (isNaN(memberPrice.value) || memberPrice.value.trim() === "") {
        alert("Member Price must be a number.");
        return;
    }

    let dish = {
        DishName: dishName.value,
        Price: price.value,
        MemberPrice: memberPrice.value
    };

    if (isEditing) {
        dish.DishID = currentDishID;
        updateDishInDatabase(dish).then(() => {
            modal.style.display = "none";
            getMenuFromDatabase().then(fillTable).catch(showError);
        }).catch((error) => {
            alert("更新失败");
        });
    } else {
        addDishToDatabase(dish).then(() => {
            modal.style.display = "none";
            getMenuFromDatabase().then(fillTable).catch(showError);
        }).catch((error) => {
            alert("插入失败");
        });
    }
    updateRadios();
});

function searchMenuFromDatabase(dishName) {
    return fetch('http://localhost:5000/search_menu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({DishName: dishName}),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

let searchInput = document.querySelector('input[type="search"]');

function fillTable(menu) {
    let table = document.getElementById("data-table");
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    for (let i = 0; i < Math.max(menu.length, 9); i++) {
        let row = table.insertRow();
        if (i < menu.length) {
            let dish = menu[i];
            row.innerHTML = `
                <td>
                    <label for="id${dish[0]}"></label><input type="radio" class="id-radio" id="id${dish[0]}" name="id-radio-group" value="${dish[0]}" onclick="updateRadios()">
                    <span class="id-number">${i + 1}</span>
                </td>
                <td>${dish[1]}</td>
                <td>${dish[2]}</td>
                <td>${dish[3]}</td>
            `;
        } else {
            row.innerHTML = `
                <td>
                    <label for="id${i + 1}"></label><input type="radio" class="id-radio" id="id${i + 1}" name="id-radio-group" value="${i + 1}" onclick="updateRadios()">
                    <span class="id-number">${i + 1}</span>
                </td>
                <td></td>
                <td></td>
                <td></td>
            `;
        }
    }
    updateRadios();
}

searchInput.addEventListener("input", function () {
    let dishName = searchInput.value;
    if (dishName.trim() === "") {
        getMenuFromDatabase().then(fillTable).catch(showError);
    } else {
        searchMenuFromDatabase(dishName).then(fillTable).catch(showError);
    }
});

function showError(error) {
    alert("操作失败：" + error.message);
}

// 复选框逻辑
let radios = document.querySelectorAll('.id-radio');
let editButton = document.getElementById('edit');
let deleteButton = document.getElementById('delete');

radios.forEach(radio => {
    radio.addEventListener('change', function () {
        if (radio.checked) {
            radio.nextElementSibling.style.display = 'none';
            editButton.style.display = 'inline';
            deleteButton.style.display = 'inline';
        } else {
            radio.nextElementSibling.style.display = 'inline';
            if (!Array.from(radios).some(radio => radio.checked)) {
                editButton.style.display = 'none';
                deleteButton.style.display = 'none';
            }
        }
    });
});


function deleteDishFromDatabase(dishID) {
    return fetch('http://localhost:5000/delete_dish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({DishID: dishID}),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

deleteButton.addEventListener('click', function () {
    editButton.style.display = 'none';
    deleteButton.style.display = 'none';

    let radios = document.querySelectorAll('.id-radio:checked');
    radios.forEach(radio => {
        let dishID = radio.value;
        deleteDishFromDatabase(dishID).then(() => {
            let row = radio.parentNode.parentNode;
            row.parentNode.removeChild(row);
            getMenuFromDatabase().then(fillTable).catch(showError);
        }).catch(showError);
    });
    updateRadios();
});

// 编辑菜品
function updateDishInDatabase(dish) {
    return fetch('http://localhost:5000/update_dish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dish),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}

editButton.addEventListener("click", function () {
    let radio = document.querySelector('.id-radio:checked');
    searchInput.value = ""
    if (radio) {
        let row = radio.parentNode.parentNode;
        dishName.value = row.cells[1].textContent;
        price.value = row.cells[2].textContent;
        memberPrice.value = row.cells[3].textContent;
        modal.style.display = "block";
        isEditing = true;
        currentDishID = radio.value;
    }
    updateRadios();
});