import React, { useState } from 'react';
import '../styles/AdminLogin.css';

const AdminLogin = ({
    onLoginSuccess,
    onNavigateToSignUp,
    onNavigateToForgotPassword,
}) => {
    const [loginId, setLoginId] = useState('');
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

        const sanitizedLoginId = loginId.trim();
        if (!sanitizedLoginId || !password) {
            setErrorMessage('Please enter both Admin ID and Password.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('/api/v1/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ loginId: sanitizedLoginId, password }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const parsedMessage = await parseApiError(response);
                throw new Error(parsedMessage);
            }

            const data = await response.json();

            if (typeof onLoginSuccess === 'function') {
                onLoginSuccess(data);
            } else {
                window.location.assign(data.redirectUrl || '/admin/dashboard');
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
                    <h1 id="admin-login-heading" className="admin-logo-title">App Logo</h1>
                </header>

                <p className="admin-portal-badge">Admin Portal</p>

                <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                    <div className="admin-form-group">
                        <label htmlFor="admin-login-id" className="admin-form-label">
                            Admin ID —
                        </label>
                        <input
                            id="admin-login-id"
                            name="loginId"
                            type="text"
                            autoComplete="username"
                            maxLength={12}
                            required
                            disabled={isSubmitting}
                            value={loginId}
                            onChange={handleInputChange(setLoginId)}
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
            </section>
        </main>
    );
};

export default AdminLogin;
