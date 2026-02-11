document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login').value;
    const passwordInput = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    try {
        const response = await fetch('/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: loginInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            // Error
            errorDiv.textContent = data.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }

    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'An unexpected error occurred. Please check your connection.';
        errorDiv.style.display = 'block';
    }
});
