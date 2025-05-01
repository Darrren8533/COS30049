import React, { useEffect } from 'react';
import './homepage.css';
import Navbar from '../../../components/navbar/navbar';

const Homepage = () => {
  
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if (elementPosition < screenPosition) {
          element.classList.add('visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="homepage">
      {/* Apply Navbar */}
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Explore Nature's Wonders</h1>
          <p>Discover the beauty of our national parks with expert guides and immersive experiences.</p>
          <div className="hero-buttons">
            <a href="/features" className="btn btn-primary">Explore Features</a>
            <a href="/about" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about animate-on-scroll">
        <h2>About ParkGuide</h2>
        <p>ParkGuide is your ultimate companion for exploring national parks. Our certified guides provide expert knowledge and ensure a safe, educational, and memorable experience for all visitors.</p>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card animate-on-scroll">
          <i className="fas fa-certificate feature-icon"></i>
          <h3>Certified Guides</h3>
          <p>All our guides undergo rigorous certification processes to ensure they provide accurate information and maintain safety standards.</p>
        </div>
        <div className="feature-card animate-on-scroll">
          <i className="fas fa-map-marked-alt feature-icon"></i>
          <h3>Expert Navigation</h3>
          <p>Our guides know the parks inside and out, taking you to hidden gems and ensuring you never get lost.</p>
        </div>
        <div className="feature-card animate-on-scroll">
          <i className="fas fa-users feature-icon"></i>
          <h3>Group Experiences</h3>
          <p>Join group tours to meet fellow nature enthusiasts or book private tours for a personalized experience.</p>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="why-choose">
        <h2 className="animate-on-scroll">Why Choose ParkGuide</h2>
        <p className="animate-on-scroll">Our platform offers comprehensive tools and resources for both visitors and guides.</p>

        <div className="benefits-container">
          <div className="benefits-card animate-on-scroll">
            <h3>For Visitors</h3>
            <ul>
              <li><i className="fas fa-check-circle"></i> Book guided tours with certified experts</li>
              <li><i className="fas fa-check-circle"></i> Access interactive maps and trail information</li>
              <li><i className="fas fa-check-circle"></i> Learn about local wildlife and plant species</li>
              <li><i className="fas fa-check-circle"></i> Get real-time updates on park conditions</li>
            </ul>
          </div>
          <div className="benefits-card animate-on-scroll">
            <h3>For Guides</h3>
            <ul>
              <li><i className="fas fa-check-circle"></i> Manage your certification and credentials</li>
              <li><i className="fas fa-check-circle"></i> Schedule and organize tours efficiently</li>
              <li><i className="fas fa-check-circle"></i> Access continuing education resources</li>
              <li><i className="fas fa-check-circle"></i> Connect with a community of fellow guides</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2 className="animate-on-scroll">What People Are Saying</h2>
        <p className="animate-on-scroll">Hear from visitors and guides who have experienced the ParkGuide difference.</p>

        <div className="testimonial-container">
          <div className="testimonial-card animate-on-scroll">
            <p>"Our guide was incredibly knowledgeable and made our family trip to Yellowstone unforgettable. The kids learned so much about wildlife conservation!"</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2" alt="Sarah Johnson" className="avatar" />
              <div>
                <h4>Sarah Johnson</h4>
                <p>Park Visitor</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card animate-on-scroll">
            <p>"The certification process was thorough and has helped me become a better guide. The continuing education resources keep me up-to-date on best practices."</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" alt="Michael Chen" className="avatar" />
              <div>
                <h4>Michael Chen</h4>
                <p>Certified Guide</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card animate-on-scroll">
            <p>"ParkGuide has been an excellent partner for our national park. Their certified guides help us ensure visitors have safe and educational experiences."</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f" alt="Emily Rodriguez" className="avatar" />
              <div>
                <h4>Emily Rodriguez</h4>
                <p>Park Ranger</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2 className="animate-on-scroll">Ready to Explore with Expert Guides?</h2>
        <p className="animate-on-scroll">Join ParkGuide today to enhance your national park experience or become a certified guide.</p>
        <div className="cta-buttons animate-on-scroll">
          <a href="/signin" className="btn btn-primary">Sign In</a>
          <a href="/signup" className="btn btn-secondary">Create Account</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-section">
          <h3>ParkGuide</h3>
          <p>Your trusted companion for exploring national parks with expert guides and comprehensive resources.</p>
          <a href="/signin">Sign In</a>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/features">Features</a></li>
            <li><a href="/testimonials">Testimonials</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/certification">Certification</a></li>
            <li><a href="/directory">Park Directory</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact</h3>
          <p><i className="fas fa-map-marker-alt"></i> 123 Park Avenue, Nature City, NC 28789</p>
          <p><i className="fas fa-envelope"></i> info@parkguide.com</p>
          <p><i className="fas fa-phone"></i> (555) 123-4567</p>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2023 ParkGuide. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Homepage;
