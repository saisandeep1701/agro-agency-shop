import React, { useState } from 'react';

interface NavbarProps {
    setSearchQuery: (query: string) => void;
    cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ setSearchQuery, cartCount }) => {
    const [localQuery, setLocalQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(localQuery);
    };

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Sandeep Agro Agencies</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="#">Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link text-white fw-bold border border-secondary rounded-pill px-3 ms-2" style={{ background: '#000' }} href="#featured-3">Organic & Bio-Inputs</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#">About</a>
                        </li>
                    </ul>
                    <div className="d-flex align-items-center me-3">
                        <span className="badge bg-dark border border-secondary text-white fs-6">🛒 Cart: {cartCount}</span>
                    </div>
                    <form className="d-flex" role="search" onSubmit={handleSearch}>
                        <input 
                            className="form-control me-2 text-bg-dark border-secondary" 
                            type="search" 
                            placeholder="Product name" 
                            aria-label="Search" 
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                        />
                        <button className="btn btn-outline-light" type="submit">Search</button>
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
