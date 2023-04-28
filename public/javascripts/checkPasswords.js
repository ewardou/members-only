const pwd = document.getElementById('pwd');
const pwdConfirm = document.getElementById('pwdConfirm');
const btn = document.querySelector('form button');

function checkPasswords() {
    return pwd.value === pwdConfirm.value;
}

btn.addEventListener('click', (e) => {
    if (!checkPasswords()) {
        e.preventDefault();
        document.querySelector('.errors').textContent = "Passwords don't match";
    }
});
