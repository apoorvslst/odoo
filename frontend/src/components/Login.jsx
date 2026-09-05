import React, { useState } from 'react';
import '../styles/Login.css';

const Login = ({
    onLoginSuccess,
    onNavigateToSignUp,
    onNavigateToForgotPassword
}) => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    const parseApiError = async (response) => {
        if (response.status === 401 || response.status === 403) {
            return 'Invalid Login Id or Password.';
        }
        if (response.status === 429) {
            return 'Too many login attempts. Please wait a few minutes and try again.';
        }
        if (response.status >= 500) {
            return 'Authentication service is temporarily unavailable. Try again later.';
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
            setErrorMessage('Please enter both Login ID and Password.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ loginId: sanitizedLoginId, password }),
                signal: controller.signal
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
                // Fallback if SPA router callback is not passed
                window.location.assign(data.redirectUrl || '/dashboard');
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
        <main className="login-container">
            <section className="login-card" aria-labelledby="login-heading">

                <header className="logo-container">
                    <h1 id="login-heading" className="logo-title">App LoGo</h1>
                </header>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="login-id" className="form-label">
                            Login Id -
                        </label>
                        <input
                            id="login-id"
                            name="loginId"
                            type="text"
                            autoComplete="username"
                            maxLength={12}
                            required
                            disabled={isSubmitting}
                            value={loginId}
                            onChange={handleInputChange(setLoginId)}
                            className={`form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">
                            Password -
                        </label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            disabled={isSubmitting}
                            value={password}
                            onChange={handleInputChange(setPassword)}
                            className={`form-input ${errorMessage ? 'input-error' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                        />
                    </div>

                    {errorMessage && (
                        <div
                            id="login-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="error-message"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <div className="submit-container">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-button"
                        >
                            {isSubmitting ? 'Verifying...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                <footer className="login-footer">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToForgotPassword}
                        className="footer-link"
                    >
                        Forgot Password
                    </button>
                    <span aria-hidden="true" className="footer-divider">|</span>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToSignUp}
                        className="footer-link"
                    >
                        Sign Up
                    </button>
                </footer>
            </section>
        </main>
    );
};

export default Login;