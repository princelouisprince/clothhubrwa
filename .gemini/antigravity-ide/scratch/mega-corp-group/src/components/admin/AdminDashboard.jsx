import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, FileText,
  Image, BarChart3, Bell, Settings, LogOut, Menu, X, Search, Home,
  ChevronLeft, ChevronRight, Moon, Sun, ShieldCheck, UserCog, Activity,
  LockKeyhole, Building2, Command, ChevronDown
} from 'lucide-react';
import AdminLogin from './AdminLogin';
import { notificationsSeed, rolePermissions } from './adminData';
import './AdminDashboard.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, permission: 'Executive intelligence' },
  { id: 'products', label: 'Products', icon: Package, permission: 'Catalog operations' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, permission: 'Fulfillment control' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'Business intelligence' },
  { id: 'staff', label: 'Staff', icon: UserCog, permission: 'Role management' },
  { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'Operations alerts' },
  { id: 'settings', label: 'Settings', icon: Settings, permission: 'System settings' }
];

export default function AdminDashboard({ children, activeView, onViewChange }) {
  const { user, logout, setView, darkMode, toggleDarkMode } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notificationsSeed.filter(item => !item.read).length;
  const activeItem = useMemo(
    () => NAV_ITEMS.find(item => item.id === activeView) || NAV_ITEMS[0],
    [activeView]
  );

  if (!user || user.role !== 'admin') {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  const userInitials = user.name
    ?.split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <div className={`admin-root ${darkMode ? 'admin-dark' : 'admin-light'}`}>
      {mobileOpen && <button className="admin-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-head">
          <button className="admin-brand" onClick={() => onViewChange('overview')} aria-label="Mega Corporation Group admin home">
            <span className="admin-logo-icon">
              <Building2 size={18} />
            </span>
            {sidebarOpen && (
              <span className="admin-logo-text">
                Mega <strong>Admin</strong>
                <small>Command Center</small>
              </span>
            )}
          </button>
          <button className="admin-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="admin-tenant-card">
          <div className="admin-tenant-pulse" />
          {sidebarOpen && (
            <div>
              <span>Enterprise workspace</span>
              <strong>Mega Corporation Group</strong>
            </div>
          )}
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${active ? 'active' : ''}`}
                onClick={() => { onViewChange(item.id); setMobileOpen(false); }}
                title={sidebarOpen ? undefined : item.label}
              >
                <Icon size={18} />
                {sidebarOpen && (
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.permission}</small>
                  </span>
                )}
                {item.id === 'notifications' && unreadCount > 0 && <em>{unreadCount}</em>}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-foot">
          <button className="admin-nav-item" onClick={() => setView('home')}>
            <Home size={18} />
            {sidebarOpen && <span><strong>Storefront</strong><small>Return to website</small></span>}
          </button>
          <button className="admin-nav-item admin-logout" onClick={logout}>
            <LogOut size={18} />
            {sidebarOpen && <span><strong>Sign Out</strong><small>End secure session</small></span>}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-header-btn desktop-only" onClick={() => setSidebarOpen(value => !value)} aria-label="Toggle sidebar">
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <button className="admin-header-btn mobile-only" onClick={() => setMobileOpen(value => !value)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <div className="admin-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={14} />
              <strong>{activeItem.label}</strong>
            </div>
          </div>

          <div className="admin-search">
            <Search size={16} />
            <input type="text" placeholder="Search orders, products, customers..." />
            <kbd><Command size={12} />K</kbd>
          </div>

          <div className="admin-header-right">
            <div className="admin-security-pill">
              <ShieldCheck size={15} />
              <span>Protected session</span>
            </div>
            <button className="admin-icon-btn" onClick={toggleDarkMode} aria-label="Toggle theme" title="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="admin-icon-btn admin-bell-btn" onClick={() => onViewChange('notifications')} aria-label="Notifications" title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
            <div className="admin-profile-menu">
              <button className="admin-user" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen}>
                <span className="admin-avatar">{userInitials}</span>
                <span className="admin-user-info">
                  <strong>{user.name || 'Administrator'}</strong>
                  <small>Administrator</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="admin-user-popover">
                  <div className="admin-user-popover-head">
                    <span className="admin-avatar lg">{userInitials}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <div className="admin-permission-list">
                    {rolePermissions[0].permissions.map(permission => (
                      <span key={permission}><LockKeyhole size={13} /> {permission}</span>
                    ))}
                  </div>
                  <button onClick={() => onViewChange('settings')}><Settings size={15} /> Security settings</button>
                  <button onClick={() => onViewChange('staff')}><Activity size={15} /> Activity and staff</button>
                  <button onClick={logout}><LogOut size={15} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
