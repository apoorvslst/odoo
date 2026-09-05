import React, { useState } from 'react';
import '../styles/AdminLogin.css';

const AdminLogin = ({
    onLoginSuccess,
    onNavigateToSignUp,
    onNavigateToForgotPassword,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (errorMessage) setErrorMessage('');
    };

    const parseApiError = async (response) => {
        if (response.status === 401 || response.status === 403) {
            return 'Invalid Admin ID or Password.';
        }
        if (response.status === 429) {
            return 'Too many login attempts. Please wait a few minutes and try again.';
        }
        if (response.status >= 500) {
            return 'Admin authentication service is temporarily unavailable.';
        }
        try {
            const data = await response.json();
            return data?.message || `Authentication failed (Error ${response.status}).`;
        } catch {
            return 'An unexpected server response was received.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const sanitizedEmail = email.trim();
        if (!sanitizedEmail || !password) {
            setErrorMessage('Please enter both Email and Password.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: sanitizedEmail, password }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const parsedMessage = await parseApiError(response);
                throw new Error(parsedMessage);
            }

            const data = await response.json();

            // Backend returns { token, user: { id, username, email, role, contactId, createdAt } }
            // Only admin and accountant roles should access admin dashboard
            if (data.user && data.user.role !== 'admin' && data.user.role !== 'accountant') {
                throw new Error('Access denied. This portal is for admin and accountant users only.');
            }

            // Store JWT token for subsequent API calls
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            if (typeof onLoginSuccess === 'function') {
                onLoginSuccess(data);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setErrorMessage('Request timed out. Please check your network and try again.');
            } else if (!navigator.onLine) {
                setErrorMessage('No internet connection. Please verify your network.');
            } else {
                setErrorMessage(err.message || 'Unable to connect to the server. Please try again.');
            }
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="admin-login-container">
            <section className="admin-login-card" aria-labelledby="admin-login-heading">

                <header className="admin-logo-container">
                    <h1 id="admin-login-heading" className="admin-logo-title">Urban Furniture</h1>
                </header>

                <p className="admin-portal-badge">Admin Portal</p>

                <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                    <div className="admin-form-group">
                        <label htmlFor="admin-login-email" className="admin-form-label">
                            Username / Email —
                        </label>
                        <input
                            id="admin-login-email"
                            name="email"
                            type="text"
                            autoComplete="username"
                            placeholder="admin or email"
                            required
                            disabled={isSubmitting}
                            value={email}
                            onChange={handleInputChange(setEmail)}
                            className={`admin-form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'admin-login-error-msg' : undefined}
                        />
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="admin-login-password" className="admin-form-label">
                            Password —
                        </label>
                        <input
                            id="admin-login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            disabled={isSubmitting}
                            value={password}
                            onChange={handleInputChange(setPassword)}
                            className={`admin-form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'admin-login-error-msg' : undefined}
                        />
                    </div>

                    {errorMessage && (
                        <div
                            id="admin-login-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="admin-error-message"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <div className="admin-submit-container">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="admin-submit-button"
                        >
                            {isSubmitting ? 'Verifying...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                <footer className="admin-login-footer">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToForgotPassword}
                        className="admin-footer-link"
                    >
                        Forgot Password
                    </button>
                    <span aria-hidden="true" className="admin-footer-divider">|</span>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToSignUp}
                        className="admin-footer-link"
                    >
                        Sign Up
                    </button>
                </footer>

                <div style={{ marginTop: '1.25rem', fontSize: '0.73rem', color: '#991b1b', background: '#fef2f2', border: '1px dashed #fecaca', padding: '6px 14px', borderRadius: '8px', textAlign: 'center', lineHeight: 1.4 }}>
                    Demo Admin: <strong>admin</strong> (or admin@accountant.local) &bull; Password: <strong>admin123</strong>
                </div>
            </section>
        </main>
    );
};

export default AdminLogin;
