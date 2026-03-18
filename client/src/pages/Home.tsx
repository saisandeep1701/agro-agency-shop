import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ProductGrid from '../components/ProductGrid';
import { Product } from '../types';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = (_product: Product) => {
    setCartCount(prev => prev + 1);
  };

  return (
    <>
      <Navbar setSearchQuery={setSearchQuery} cartCount={cartCount} />
      <Hero />
      <ProductGrid searchQuery={searchQuery} onAddToCart={handleAddToCart} />
      <Features />
      
      <div className="container">
        <footer className="row row-cols-1 row-cols-sm-2 row-cols-md-5 py-5 my-5 border-top text-body-secondary">
          <div className="col mb-3">
            <p>© 2026 Sandeep Agro Agencies</p>
          </div>
          <div className="col mb-3"></div>
          <div className="col mb-3">
            <h5>Categories</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-body-secondary">Pesticides</a></li>
              <li className="nav-item mb-2"><a href="#" className="nav-link p-0 text-body-secondary">Fertilizers</a></li>
            </ul>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
