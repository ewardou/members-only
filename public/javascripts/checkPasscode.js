const passcodeInput = document.getElementById('passcode');
const btn = document.querySelector('form button');

function checkPasscode() {
    return passcodeInput.value === 'mango';
}

btn.addEventListener('click', (e) => {
    if (!checkPasscode()) {
        e.preventDefault();
        document.querySelector('.errors').textContent = 'Incorrect code';
        passcodeInput.value = '';
    }
});
