import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5100';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log(`[AUTH-DIAGNOSTIC] Firing Login POST to: ${API_BASE_URL}/api/auth/login`);
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            console.log(`[AUTH-DIAGNOSTIC] Response received visually carrying Status Code: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                navigate('/admin');
            } else {
                setError('Invalid admin credentials.');
            }
        } catch (err) {
            console.error(err);
            setError('Could not reach the authentication server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="card text-bg-dark border-secondary shadow p-4" style={{ width: '400px' }}>
                <h3 className="text-center mb-4 text-success">Admin Secure Gateway</h3>
                {error && <div className="alert alert-danger p-2">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Admin Username</label>
                        <input type="text" required className="form-control bg-dark text-light" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Password</label>
                        <input type="password" required className="form-control bg-dark text-light" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-success w-100 fw-bold" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Enter Console'}
                    </button>
                </form>
                <div className="text-center mt-3">
                    <button className="btn btn-link text-muted text-decoration-none" onClick={() => navigate('/')}>&larr; Return to Market</button>
                </div>
            </div>
        </div>
    );
};

export default Login;
