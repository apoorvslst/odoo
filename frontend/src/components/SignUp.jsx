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

        if (sanitizedId.length < 3) {
            errors.loginId = 'Username must be at least 3 characters.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        // Backend only enforces: required fields + password min 6 chars.
        if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
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
            return 'An account with this username or email already exists.';
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

    const fields = [
        { id: 'signup-loginId', label: 'Username', key: 'loginId', type: 'text', maxLength: 60, auto: 'username', placeholder: 'johndoe' },
        { id: 'signup-email', label: 'Email', key: 'email', type: 'email', maxLength: 254, auto: 'email', placeholder: 'you@company.com' },
        { id: 'signup-password', label: 'Password', key: 'password', type: 'password', maxLength: 128, auto: 'new-password', placeholder: 'Min 6 characters' },
        { id: 'signup-rePassword', label: 'Confirm password', key: 'rePassword', type: 'password', maxLength: 128, auto: 'new-password', placeholder: 'Repeat password' },
    ];

    return (
        <main className="w-full max-w-sm">
            <section className="card card-lg p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <header className="mb-8 text-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                        Accountant<span className="text-orange-500">++</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">Create your account</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {fields.map((field) => (
                        <div key={field.key}>
                            <label htmlFor={field.id} className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {field.label}
                            </label>
                            <input
                                id={field.id}
                                name={field.key}
                                type={field.type}
                                autoComplete={field.auto}
                                maxLength={field.maxLength}
                                placeholder={field.placeholder}
                                disabled={isSubmitting}
                                value={formData[field.key]}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                className={`input ${fieldErrors[field.key] ? 'border-rose-400' : ''}`}
                                aria-invalid={Boolean(fieldErrors[field.key])}
                                aria-describedby={fieldErrors[field.key] ? `${field.id}-err` : undefined}
                            />
                            {fieldErrors[field.key] && (
                                <span id={`${field.id}-err`} role="alert" className="block mt-1 text-xs text-rose-600">
                                    {fieldErrors[field.key]}
                                </span>
                            )}
                        </div>
                    ))}

                    {fieldErrors.submit && (
                        <div role="alert" aria-live="polite" className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                            {fieldErrors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-2.5 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99] cursor-pointer'}`}
                    >
                        {isSubmitting ? 'Creating…' : 'Create account'}
                    </button>
                </form>

                <footer className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-sm">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToForgotPassword}
                        className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Forgot password
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onNavigateToLogin}
                        className="font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                    >
                        Sign in
                    </button>
                </footer>
            </section>

            <p className="mt-4 text-center text-xs text-slate-400">
                The first account created becomes the <span className="font-semibold text-slate-500">admin</span>.
            </p>
        </main>
    );
};

export default SignUp;
