import React, { useState } from 'react';
import '../styles/ConsumerLogin.css';

const ConsumerLogin = ({
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
            return 'Invalid Email or Password.';
        }
        if (response.status === 429) {
            return 'Too many login attempts. Please wait a few minutes and try again.';
        }
        if (response.status >= 500) {
            return 'Authentication service is temporarily unavailable.';
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
            // Backend has a single unified login endpoint
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
            // Consumer portal is for contact-role users
            if (data.user && data.user.role !== 'contact') {
                throw new Error('This portal is for contact (customer/vendor) users. Please use the Admin Portal.');
            }

            // Store JWT token
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
        <main className="consumer-login-container">
            <section className="consumer-login-card" aria-labelledby="consumer-login-heading">

                <header className="consumer-logo-container">
                    <h1 id="consumer-login-heading" className="consumer-logo-title">Urban Furniture</h1>
                </header>

                <p className="consumer-portal-badge">Consumer Portal</p>

                <form onSubmit={handleSubmit} className="consumer-login-form" noValidate>
                    <div className="consumer-form-group">
                        <label htmlFor="consumer-login-email" className="consumer-form-label">
                            Email —
                        </label>
                        <input
                            id="consumer-login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            disabled={isSubmitting}
                            value={email}
                            onChange={handleInputChange(setEmail)}
                            className={`consumer-form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'consumer-login-error-msg' : undefined}
                        />
                    </div>

                    <div className="consumer-form-group">
                        <label htmlFor="consumer-login-password" className="consumer-form-label">
                            Password —
                        </label>
                        <input
                            id="consumer-login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            disabled={isSubmitting}
                            value={password}
                            onChange={handleInputChange(setPassword)}
                            className={`consumer-form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'consumer-login-error-msg' : undefined}
                        />
                    </div>

                    {errorMessage && (
                        <div
                            id="consumer-login-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="consumer-error-message"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <div className="consumer-submit-container">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="consumer-submit-button"
                        >
                            {isSubmitting ? 'Verifying...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                <footer className="consumer-login-footer">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToForgotPassword}
                        className="consumer-footer-link"
                    >
                        Forgot Password
                    </button>
                    <span aria-hidden="true" className="consumer-footer-divider">|</span>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToSignUp}
                        className="consumer-footer-link"
                    >
                        Sign Up
                    </button>
                </footer>
            </section>
        </main>
    );
};

export default ConsumerLogin;
