import { useState } from 'react';

const Login = ({
    portalType = 'admin',
    onLoginSuccess,
    onNavigateToSignUp,
    onNavigateToForgotPassword
}) => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = portalType === 'admin';

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (errorMessage) setErrorMessage('');
    };

    const parseApiError = async (response) => {
        if (response.status === 401 || response.status === 403) return 'Invalid email or password.';
        if (response.status === 429) return 'Too many login attempts. Please wait a few minutes and try again.';
        if (response.status >= 500) return 'Authentication service is temporarily unavailable. Try again later.';
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
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email: sanitizedLoginId, password }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const parsedMessage = await parseApiError(response);
                throw new Error(parsedMessage);
            }

            const data = await response.json();
            if (typeof onLoginSuccess === 'function') onLoginSuccess(data);
            else window.location.assign('/');
        } catch (err) {
            if (err.name === 'AbortError') setErrorMessage('Request timed out. Please check your network and try again.');
            else if (!navigator.onLine) setErrorMessage('No internet connection. Please verify your network.');
            else setErrorMessage(err.message || 'Unable to connect to the server. Please try again.');
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="fade-in" style={{ width: '100%', maxWidth: 380 }}>
                <section className="auth-card">
                    <header className="t-center" style={{ marginBottom: '1.5rem' }}>
                        <div className="auth-brand">VYAPAR360</div>
                        <div className="auth-badge">
                            <span className="auth-rule" />
                            {portalType === 'admin' ? 'ADMIN & ACCOUNTANT PORTAL' : portalType === 'vendor' ? 'VENDOR PORTAL' : portalType === 'customer' ? 'CUSTOMER PORTAL' : 'SELF-SERVICE PORTAL'}
                            <span className="auth-rule" />
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="stack" noValidate>
                        <div className="field">
                            <label htmlFor="login-id" className="auth-label">Username / Email</label>
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
                                className={`input ${errorMessage ? 'is-error' : ''}`}
                                aria-invalid={Boolean(errorMessage)}
                                aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                                placeholder="admin"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="login-password" className="auth-label">Password</label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={isSubmitting}
                                value={password}
                                onChange={handleInputChange(setPassword)}
                                className={`input ${errorMessage ? 'is-error' : ''}`}
                                aria-invalid={Boolean(errorMessage)}
                                aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                                placeholder="••••••••"
                            />
                        </div>

                        {errorMessage && (
                            <div id="login-error-msg" role="alert" aria-live="polite" className="form-error" style={{ marginBottom: 0 }}>
                                {errorMessage}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="auth-submit">
                            {isSubmitting ? 'SIGNING IN…' : 'SIGN IN'}
                        </button>
                    </form>

                    <footer className="auth-foot">
                        <button type="button" disabled={isSubmitting} onClick={onNavigateToForgotPassword} className="btn-link">
                            Forgot Password
                        </button>
                        <span className="sep">|</span>
                        <button type="button" disabled={isSubmitting} onClick={onNavigateToSignUp} className="auth-link">
                            Create Account
                        </button>
                    </footer>

                    {isAdmin && (
                        <p className="demo-note">
                            Demo Admin: <strong>admin</strong> · Password: <strong>admin123</strong>
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Login;
