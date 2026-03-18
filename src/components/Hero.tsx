import React from 'react';

const Hero: React.FC = () => {
    return (
        <div className="content-container container mt-4 rounded shadow">
            <div className="px-4 py-5 my-5 text-center text-white" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '15px' }}>
                <h1 className="display-4 fw-bold">Healthy Crops. Higher Yields. Trusted Protection.</h1>
                <div className="col-lg-6 mx-auto">
                    <p className="lead mb-4">We provide reliable pesticides and fertilizers designed to protect your crops and boost growth. Safe, effective, and tailored for Indian farms.</p>
                    <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
                        <button type="button" className="btn btn-success btn-lg px-4 me-sm-3">Products</button>
                        <button type="button" className="btn btn-outline-light btn-lg px-4">Contact us</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
