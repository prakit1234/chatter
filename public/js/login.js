import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            await Auth.login(email, password);
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    });
});