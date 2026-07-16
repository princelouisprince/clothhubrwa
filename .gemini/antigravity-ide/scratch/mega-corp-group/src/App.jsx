import React, { useContext, useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { AppContextProvider, AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOverview from './components/admin/AdminOverview';
import AdminProducts from './components/admin/AdminProducts';
import AdminOrders from './components/admin/AdminOrders';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminStaff from './components/admin/AdminStaff';
import AdminNotifications from './components/admin/AdminNotifications';
import AdminSettings from './components/admin/AdminSettings';
import AboutPage from './components/AboutPage';
import { Search, Filter, ArrowRight, Phone, Mail, MapPin, Sparkles, Compass, ShieldCheck, Quote, ShieldAlert } from 'lucide-react';

/* ─── Category Highlights ─────────────────────────────── */
const ABOUT_VALUES = [
  {
    title: 'Quality First',
    description: 'Every batch is tested to ensure consistency, reliability, and exceptional cleaning performance.',
    icon: <ShieldCheck size={18} />
  },
  {
    title: 'Innovation',
    description: 'We invest in modern formulation and production methods to stay ahead of changing customer needs.',
    icon: <Sparkles size={18} />
  },
  {
    title: 'Sustainability',
    description: 'Our approach embraces responsible manufacturing practices that protect people and the environment.',
    icon: <Compass size={18} />
  }
];

const MANUFACTURING_ITEMS = [
  'Laundry Detergents',
  'Liquid Laundry Soap',
  'Dishwashing Liquid',
  'Multi-Purpose Surface Cleaners',
  'Bathroom and Toilet Cleaners',
  'Bleach and Disinfectants',
  'Fabric Softeners',
  'Industrial Cleaning Chemicals',
  'Private Label Manufacturing'
];

const TESTIMONIALS = [
  {
    quote: 'Their disinfectants and detergents have helped us maintain spotless standards with consistent quality across multiple locations.',
    name: 'Aline M.',
    role: 'Operations Manager, Hospitality Group'
  },
  {
    quote: 'The products are reliable, easy to use, and meet our compliance demands without compromising performance.',
    name: 'Daniel K.',
    role: 'Procurement Lead, Healthcare Facility'
  }
];

const INDUSTRIES = ['Homes', 'Hotels', 'Restaurants', 'Hospitals', 'Offices'];
const CERTIFICATIONS = ['ISO 9001', 'SDS Compliance', 'Quality Tested', 'Bulk Supply Ready'];

function Reveal({ children, delay = 0, className = '', direction = 'up' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: direction === 'left' ? -24 : 32, x: direction === 'left' ? -24 : 0 },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay } }
  };

  return (
    <motion.div ref={ref} initial={prefersReducedMotion ? false : 'hidden'} animate={isInView ? 'visible' : 'hidden'} variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

function AppContent() {
  const { view, setView, products, productsLoading, user, setAuthModalOpen, setAuthMode, adminView, setAdminView } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

  const handleViewMore = () => {
    if (user) setView('shop');
    else { setAuthMode('login'); setAuthModalOpen(true); }
  };

  const filteredProducts = products.filter(p => {
    const s = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const c = selectedCategory === 'All' || p.category === selectedCategory;
    return s && c;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {view !== 'admin' && <Navbar />}

      <main style={{ flex: 1 }}>

        {/* ─── HOME VIEW ─── */}
        {view === 'home' && (
          <>
            <Hero />

            <section className="section about-story-section">
              <div className="container">
                <div className="about-story-grid">
                  <Reveal className="about-story-card story-card" delay={0.05}>
                    <span className="eyebrow">Our story</span>
                    <h3>From a local start to a trusted regional partner.</h3>
                    <p>What began as a small local enterprise has grown into one of the region's trusted manufacturers and suppliers of household and industrial cleaning solutions, respected for quality, consistency, and customer commitment.</p>
                  </Reveal>
                  <Reveal className="about-story-card mission-card" delay={0.1}>
                    <span className="eyebrow">Our mission</span>
                    <h3>To improve everyday living with safe, effective, and affordable cleaning solutions.</h3>
                  </Reveal>
                  <Reveal className="about-story-card vision-card" delay={0.15}>
                    <span className="eyebrow">Our vision</span>
                    <h3>To become East Africa’s leading name in cleaning and hygiene innovation.</h3>
                  </Reveal>
                </div>
              </div>
            </section>

            <section className="section values-section">
              <div className="container">
                <div className="section-heading">
                  <span className="eyebrow">Our values</span>
                  <h2>Built on quality, integrity, sustainability, and service.</h2>
                </div>
                <div className="about-values-grid">
                  {ABOUT_VALUES.map((value, index) => (
                    <Reveal key={value.title} delay={0.08 * index}>
                      <motion.article className="about-value-card" whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.3 }}>
                        <div className="about-value-icon">{value.icon}</div>
                        <h3>{value.title}</h3>
                        <p>{value.description}</p>
                      </motion.article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            <section className="section manufacturing-section">
              <div className="container">
                <div className="manufacturing-grid">
                  <Reveal className="manufacturing-copy" delay={0.05}>
                    <span className="eyebrow">What we manufacture</span>
                    <h2>From everyday essentials to industrial-grade chemicals.</h2>
                    <p>Our product range covers detergents, soaps, disinfectants, surface cleaners, fabric care, and private-label manufacturing for distributors, retailers, and institutions.</p>
                    <motion.button className="btn btn-primary" onClick={handleViewMore} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.25 }}>Request wholesale pricing <ArrowRight size={16} /></motion.button>
                  </Reveal>
                  <Reveal className="manufacturing-list" delay={0.12}>
                    <div className="manufacturing-list-card">
                      <ul>
                        {MANUFACTURING_ITEMS.map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>

            <section className="section testimonials-section">
              <div className="container">
                <div className="section-heading">
                  <span className="eyebrow">Industries we serve</span>
                  <h2>Trusted by homes, hospitality, healthcare, and commercial operations.</h2>
                </div>
                <div className="industry-grid">
                  {INDUSTRIES.map((industry, index) => (
                    <Reveal key={industry} delay={0.06 * index}>
                      <motion.div className="industry-pill" initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }} animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 * index }}>
                        {industry}
                      </motion.div>
                    </Reveal>
                  ))}
                </div>
                <div className="cert-grid">
                  {CERTIFICATIONS.map((cert, index) => (
                    <motion.div key={cert} className="cert-pill" initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }} animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 * index }}>
                      {cert}
                    </motion.div>
                  ))}
                </div>
                <div className="testimonials-grid">
                  {TESTIMONIALS.map((testimonial, index) => (
                    <Reveal key={testimonial.name} delay={0.08 * index} direction={index % 2 === 0 ? 'left' : 'right'}>
                      <motion.article className="testimonial-card" initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }} animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
                        <div className="testimonial-icon"><Quote size={16} /></div>
                        <p>“{testimonial.quote}”</p>
                        <div className="testimonial-author">
                          <strong>{testimonial.name}</strong>
                          <span>{testimonial.role}</span>
                        </div>
                      </motion.article>
                    </Reveal>
                  ))}
                </div>
                <Reveal className="cta-panel" delay={0.1}>
                  <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }} animate={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                    <span className="eyebrow">Wholesale enquiries</span>
                    <h3>Ready to stock reliable cleaning solutions for your business?</h3>
                    <p>Partner with us for bulk supply, dependable availability, and products engineered for professional cleaning performance.</p>
                  </motion.div>
                  <motion.button className="btn btn-primary" onClick={handleViewMore} initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }} animate={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.18, duration: 0.5, ease: 'easeOut' }} whileHover={{ y: -2, scale: 1.01 }}>Contact our team</motion.button>
                </Reveal>
              </div>
            </section>
          </>
        )}

        {/* ─── ABOUT VIEW ─── */}
        {view === 'about' && (
          <AboutPage onNavigate={setView} />
        )}


        {/* ─── SHOP / CATALOG VIEW ─── */}
        {view === 'shop' && (
          <section className="section">
            <div className="container">
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-dark)' }}>
                  Product Catalog
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Browse our full range of premium cleaning and sanitization products.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '38px', background: '#fff', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Filter size={13} /> Filter:
                  </span>
                  {['All', 'Soaps', 'Detergents', 'Disinfectants'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: '12px', fontWeight: 600, border: '1.5px solid',
                        borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border)',
                        background: selectedCategory === cat ? 'var(--primary)' : '#fff',
                        color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'var(--transition)'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {productsLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>No products match your search.</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Try different keywords or reset the category filter.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── ADMIN VIEW ─── */}
        {view === 'admin' && (
          <AdminDashboard activeView={adminView} onViewChange={setAdminView}>
            {adminView === 'overview' && <AdminOverview />}
            {adminView === 'products' && <AdminProducts />}
            {adminView === 'orders' && <AdminOrders />}
            {adminView === 'analytics' && <AdminAnalytics />}
            {adminView === 'staff' && <AdminStaff />}
            {adminView === 'notifications' && <AdminNotifications />}
            {adminView === 'settings' && <AdminSettings />}
          </AdminDashboard>
        )}

      </main>

      {view !== 'admin' && <CartSidebar />}
      {view !== 'admin' && <AuthModal />}

      {/* ─── FOOTER ─── */}
      {view !== 'admin' && <footer className="footer luxury-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand-name">Mega <span>Corp</span> Group</div>
              <p className="footer-desc">
                A leading manufacturer of biodegradable soaps, concentrated detergents, and eco-friendly disinfectants — trusted by homes and businesses worldwide.
              </p>
            </div>
            <div>
              <div className="footer-col-title">Quick Links</div>
              <ul className="footer-links">
                <li><button onClick={() => setView('home')}>Home</button></li>
                <li><button onClick={handleViewMore}>Catalog</button></li>
                <li><button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}>Admin Login</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Contact</div>
              <div className="footer-contacts">
                <div className="footer-contact-row"><MapPin size={14} className="footer-contact-icon" /><span>100 Cleanliness Ave, Lab Sector, NY 10001</span></div>
                <div className="footer-contact-row"><Phone size={14} className="footer-contact-icon" /><span>+250 782 127 881</span></div>
                <div className="footer-contact-row"><Mail size={14} className="footer-contact-icon" /><span>info@megacorp.com</span></div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={14} />
              <span>© 2026 Mega Corporation Group. All Rights Reserved.</span>
            </div>
            <div className="footer-bottom-links">
              {user?.role === 'admin' && (
                <button className="footer-admin-btn" onClick={() => setView('admin')}>
                  <ShieldAlert size={14} /> Admin
                </button>
              )}
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>}
    </div>
  );
}

/* Helper to reference CSS vars in JSX inline styles */
function var_(name) { return `var(${name})`; }

export default function App() {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}
