import { useState } from 'react';

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
            return 'Invalid email or password.';
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
            setErrorMessage('Please enter both email and password.');
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
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email: sanitizedLoginId, password }),
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
                window.location.assign('/');
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
        <main className="w-full max-w-sm">
            <section className="card card-lg p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <header className="mb-8 text-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                        Accountant<span className="text-orange-500">++</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">Sign in to your workspace</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="login-id" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Email
                        </label>
                        <input
                            id="login-id"
                            name="email"
                            type="text"
                            autoComplete="username"
                            maxLength={254}
                            required
                            disabled={isSubmitting}
                            value={loginId}
                            onChange={handleInputChange(setLoginId)}
                            className={`input ${errorMessage ? 'border-rose-400' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                            placeholder="you@company.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Password
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
                            className={`input ${errorMessage ? 'border-rose-400' : ''}`}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMessage && (
                        <div
                            id="login-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-2.5 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99] cursor-pointer'}`}
                    >
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
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
                        onClick={onNavigateToSignUp}
                        className="font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                    >
                        Create account
                    </button>
                </footer>
            </section>

            <p className="mt-4 text-center text-xs text-slate-400">
                Demo admin: <span className="font-semibold text-slate-500">admin@accountant.local</span> · <span className="font-semibold text-slate-500">admin123</span>
            </p>
        </main>
    );
};

export default Login;
