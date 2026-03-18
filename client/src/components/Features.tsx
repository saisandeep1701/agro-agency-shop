import React from 'react';

const Features: React.FC = () => {
    return (
        <div className="container mt-5">
            <div id="carouselExampleIndicators" className="carousel slide shadow-lg rounded overflow-hidden">
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
                </div>
                <div className="carousel-inner" style={{ maxHeight: '500px' }}>
                    <div className="carousel-item active">
                        <img src="/application-of-water-soluble-fertilizers-pesticides-or-herbicides-in-the-field-view-from-the-drone-2G4YKF3.jpg" className="d-block w-100" style={{ objectFit: 'cover', height: '100%' }} alt="Drone application" />
                    </div>
                    <div className="carousel-item">
                        <img src="/farming-chemical-fertilizers-500x500.webp" className="d-block w-100" style={{ objectFit: 'cover', height: '100%' }} alt="Fertilizers" />
                    </div>
                    <div className="carousel-item">
                        <img src="/tractor-applying-pesticides-fertilizers-soybean-field-concept-agricultural-machinery-crop-spraying-soybean-farming-pesticide-application-fertilizer-spreading_864588-59057.avif" className="d-block w-100" style={{ objectFit: 'cover', height: '100%' }} alt="Tractor applying pesticides" />
                    </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
        </div>
    );
};

export default Features;
