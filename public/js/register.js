import { Auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match!");
            }

            await Auth.register(username, email, password);
            
            // Show success message
            errorMessage.textContent = 'Registration successful! Please check your email.';
            errorMessage.className = 'error-message success';
            errorMessage.style.display = 'block';
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.className = 'error-message error';
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    });
});