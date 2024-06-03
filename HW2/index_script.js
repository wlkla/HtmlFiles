// 要操作到的元素
let login = document.getElementById('login');
let register = document.getElementById('register');
let form_box = document.getElementsByClassName('form-box')[0];
let register_box = document.getElementsByClassName('register-box')[0];
let login_box = document.getElementsByClassName('login-box')[0];

// 注册表单输入元素
let username = document.querySelector('.register-box input[placeholder="用户名"]');
let phoneNumber = document.querySelector('.register-box input[placeholder="手机号"]');
let gender = document.querySelector('.register-box input[placeholder="性别"]');
let address = document.querySelector('.register-box input[placeholder="地址"]');
let password = document.querySelector('.register-box input[placeholder="密码"]');


let loginForm = document.querySelector('.login-box');
let registerForm = document.querySelector('.register-box');
let registerButton = document.getElementById('registerButton');
let loginButton = document.getElementById('loginButton');
// 去注册按钮点击事件
register.addEventListener('click', () => {
    form_box.style.transform = 'translateX(82%)';
    login_box.classList.add('hidden');
    register_box.classList.remove('hidden');

    let inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });
})

// 去登录按钮点击事件
login.addEventListener('click', () => {
    form_box.style.transform = 'translateX(0%)';
    register_box.classList.add('hidden');
    login_box.classList.remove('hidden');

    let inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });
})


// 用户注册
function addUserToDatabase(user) {
    return fetch('http://localhost:5000/register', {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
        }, body: JSON.stringify(user),
    }).then(response => {
        if (!response.ok) {
            throw new Error(response.json().message);
        }
        return response.json();
    });
}


registerButton.addEventListener("click", function (event) {
    event.preventDefault();

    let inputs = registerForm.querySelectorAll('input');
    let user = {
        customerName: inputs[0].value,
        phonenumber: inputs[1].value,
        sex: inputs[2].value,
        address: inputs[3].value,
        password: inputs[4].value,
        member: 0,
    };

    addUserToDatabase(user).then(() => {
        let loginInputs = loginForm.querySelectorAll('input');
        loginInputs[0].value = user.phonenumber;
        loginInputs[1].value = user.password;

        form_box.style.transform = 'translateX(0%)';
        register_box.classList.add('hidden');
        login_box.classList.remove('hidden');
    }).catch((error) => {
        alert(error.text);
    });
});


function loginUser(user) {
    return fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    }).then(response => {
        if (!response.ok) {
            return response.json().then(json => {
                throw new Error(json.message);
            });
        }
        return response.json();
    });
}

loginButton.addEventListener("click", function (event) {
    event.preventDefault();
    let inputs = loginForm.querySelectorAll('input');
    let user = {
        phonenumber: inputs[0].value,
        password: inputs[1].value,
    };

    loginUser(user).then((data) => {
        window.location.href = "main.html";

    }).catch((error) => {
        alert(error.message);
    });
});


