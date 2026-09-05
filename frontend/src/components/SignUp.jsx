import React, { useState } from 'react';
import '../styles/SignUp.css';

const INITIAL_FORM = {
    loginId: '',
    email: '',
    password: '',
    rePassword: '',
};

const SignUp = ({ onNavigateToLogin, onNavigateToForgotPassword }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const errors = {};
        const sanitizedId = formData.loginId.trim();

        if (sanitizedId.length < 6 || sanitizedId.length > 12) {
            errors.loginId = 'Login ID must be between 6 and 12 characters.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            errors.email = 'Enter a valid corporate email address.';
        }

        const hasLower = /[a-z]/.test(formData.password);
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
        const hasValidLength = formData.password.length > 8;

        if (!hasLower || !hasUpper || !hasSpecial || !hasValidLength) {
            errors.password = 'Must be > 8 characters with lowercase, uppercase, and special character.';
        }

        if (formData.password !== formData.rePassword) {
            errors.rePassword = 'Passwords do not match.';
        }

        return errors;
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field] || fieldErrors.submit) {
            setFieldErrors((prev) => ({ ...prev, [field]: '', submit: '' }));
        }
    };

    const parseApiError = async (response) => {
        if (response.status === 409) {
            return 'An account with this Login ID or Email already exists.';
        }
        if (response.status === 422) {
            return 'Validation failed. Verify input criteria and try again.';
        }
        if (response.status === 429) {
            return 'Too many registration requests. Please wait and try again later.';
        }
        if (response.status >= 500) {
            return 'Account creation is temporarily unavailable. Try again later.';
        }

        try {
            const data = await response.json();
            return data?.error || data?.message || `Registration failed (Error ${response.status}).`;
        } catch {
            return 'Received an unexpected response from the server.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.loginId.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const message = await parseApiError(response);
                throw new Error(message);
            }

            setFormData(INITIAL_FORM);
            alert('Account created successfully! You can now sign in.');
            if (typeof onNavigateToLogin === 'function') {
                onNavigateToLogin();
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setFieldErrors({ submit: 'Request timed out. Please check your network.' });
            } else if (!navigator.onLine) {
                setFieldErrors({ submit: 'No network connection detected.' });
            } else {
                setFieldErrors({ submit: err.message || 'Registration failed. Try again.' });
            }
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="signup-container">
            <section className="signup-card" aria-labelledby="signup-heading">
                <header className="logo-container">
                    <h1 id="signup-heading" className="logo-title">Urban Furniture</h1>
                </header>

                <p className="signup-portal-badge">Create Account</p>

                <form onSubmit={handleSubmit} className="signup-form" noValidate>
                    {[
                        { id: 'signup-loginId', label: 'Enter Username —', key: 'loginId', type: 'text', maxLength: 12, auto: 'username' },
                        { id: 'signup-email', label: 'Enter Email —', key: 'email', type: 'email', maxLength: 254, auto: 'email' },
                        { id: 'signup-password', label: 'Enter Password —', key: 'password', type: 'password', maxLength: 128, auto: 'new-password' },
                        { id: 'signup-rePassword', label: 'Re-Enter Password —', key: 'rePassword', type: 'password', maxLength: 128, auto: 'new-password' },
                    ].map((field) => (
                        <div key={field.key} className="field-wrapper">
                            <div className="form-group">
                                <label htmlFor={field.id} className="form-label">
                                    {field.label}
                                </label>
                                <input
                                    id={field.id}
                                    name={field.key}
                                    type={field.type}
                                    autoComplete={field.auto}
                                    maxLength={field.maxLength}
                                    disabled={isSubmitting}
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    className={`form-input ${fieldErrors[field.key] ? 'input-error' : ''}`}
                                    aria-invalid={Boolean(fieldErrors[field.key])}
                                    aria-describedby={fieldErrors[field.key] ? `${field.id}-err` : undefined}
                                />
                            </div>
                            {fieldErrors[field.key] && (
                                <span id={`${field.id}-err`} role="alert" className="field-error-text">
                                    {fieldErrors[field.key]}
                                </span>
                            )}
                        </div>
                    ))}

                    {fieldErrors.submit && (
                        <div role="alert" aria-live="polite" className="submit-error-alert">
                            {fieldErrors.submit}
                        </div>
                    )}

                    <div className="submit-container">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-button"
                        >
                            {isSubmitting ? 'Creating...' : 'Sign Up'}
                        </button>
                    </div>
                </form>

                <footer className="signup-footer">
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
                        onClick={onNavigateToLogin}
                        className="footer-link"
                    >
                        Sign In
                    </button>
                </footer>
            </section>
        </main>
    );
};

export default SignUp;