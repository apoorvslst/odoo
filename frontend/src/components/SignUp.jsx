import { useState } from 'react';

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
        if (sanitizedId.length < 3) errors.loginId = 'Username must be at least 3 characters.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) errors.email = 'Enter a valid email address.';
        if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
        if (formData.password !== formData.rePassword) errors.rePassword = 'Passwords do not match.';
        return errors;
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field] || fieldErrors.submit) {
            setFieldErrors((prev) => ({ ...prev, [field]: '', submit: '' }));
        }
    };

    const parseApiError = async (response) => {
        if (response.status === 409) return 'An account with this username or email already exists.';
        if (response.status === 422) return 'Validation failed. Verify input criteria and try again.';
        if (response.status === 429) return 'Too many registration requests. Please wait and try again later.';
        if (response.status >= 500) return 'Account creation is temporarily unavailable. Try again later.';
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
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        setIsSubmitting(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    username: formData.loginId.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) { const message = await parseApiError(response); throw new Error(message); }
            setFormData(INITIAL_FORM);
            alert('Account created successfully! You can now sign in.');
            if (typeof onNavigateToLogin === 'function') onNavigateToLogin();
        } catch (err) {
            if (err.name === 'AbortError') setFieldErrors({ submit: 'Request timed out. Please check your network.' });
            else if (!navigator.onLine) setFieldErrors({ submit: 'No network connection detected.' });
            else setFieldErrors({ submit: err.message || 'Registration failed. Try again.' });
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    const fields = [
        { id: 'signup-loginId',    label: 'Username',        key: 'loginId',    type: 'text',     maxLength: 60,  auto: 'username',     placeholder: 'johndoe' },
        { id: 'signup-email',      label: 'Email',           key: 'email',      type: 'email',    maxLength: 254, auto: 'email',         placeholder: 'you@company.com' },
        { id: 'signup-password',   label: 'Password',        key: 'password',   type: 'password', maxLength: 128, auto: 'new-password',  placeholder: 'Min 6 characters' },
        { id: 'signup-rePassword', label: 'Confirm Password',key: 'rePassword', type: 'password', maxLength: 128, auto: 'new-password',  placeholder: 'Repeat password' },
    ];

    return (
        <main className="auth-page">
            <div className="fade-in" style={{ width: '100%', maxWidth: 380 }}>
                <section className="auth-card">
                    <header className="t-center" style={{ marginBottom: '1.5rem' }}>
                        <div className="auth-brand">VYAPAR360</div>
                        <p className="auth-badge">CREATE NEW ACCOUNT</p>
                    </header>

                    <form onSubmit={handleSubmit} className="stack" noValidate>
                        {fields.map((field) => (
                            <div key={field.key} className="field">
                                <label htmlFor={field.id} className="auth-label">
                                    {field.label}
                                </label>
                                <input
                                    id={field.id}
                                    name={field.key}
                                    type={field.type}
                                    autoComplete={field.auto}
                                    maxLength={field.maxLength}
                                    required
                                    disabled={isSubmitting}
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    className={`input ${fieldErrors[field.key] ? 'is-error' : ''}`}
                                    aria-invalid={Boolean(fieldErrors[field.key])}
                                    aria-describedby={fieldErrors[field.key] ? `${field.id}-err` : undefined}
                                    placeholder={field.placeholder}
                                />
                                {fieldErrors[field.key] && (
                                    <span id={`${field.id}-err`} role="alert" className="field-err">
                                        {fieldErrors[field.key]}
                                    </span>
                                )}
                            </div>
                        ))}

                        {fieldErrors.submit && (
                            <div role="alert" aria-live="polite" className="form-error" style={{ marginBottom: 0 }}>
                                {fieldErrors.submit}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="auth-submit">
                            {isSubmitting ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <footer className="auth-foot">
                        <button type="button" disabled={isSubmitting} onClick={onNavigateToForgotPassword} className="btn-link">
                            Help
                        </button>
                        <span className="sep">|</span>
                        <button type="button" disabled={isSubmitting} onClick={onNavigateToLogin} className="auth-link">
                            Sign In Instead
                        </button>
                    </footer>
                </section>
            </div>
        </main>
    );
};

export default SignUp;
