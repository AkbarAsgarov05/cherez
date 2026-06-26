import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminPanel.css';
import AllOrders from './components/AllOrders';
import ProfileContent from './components/ProfileContent';
import ProductList from './components/ProductList';
import ProductUpload from './components/ProductUpload';
import Dashboard from './components/Dashboard';
import MessageSection from './components/MessageSection/MessageSection';
import Users from './components/Users';
import { useOrders } from '../../hooks/useOrders';
import Campaigns from './components/Campaigns';
import Blog from './components/Blog';
import NotificationCenter from './components/NotificationCenter';
import Categories from './components/Categories';
import { 
  FiSearch, FiBell, FiMail, FiUser, FiMenu, 
  FiUsers, FiShoppingBag, FiFileText, 
  FiShoppingCart, FiMessageSquare, FiBell as FiBellIcon,
  FiSettings, FiFile, FiLogOut, FiUserCheck, FiPackage,
  FiShoppingCart as FiCartIcon, FiXCircle, FiChevronDown,
  FiList, FiUpload, FiBarChart2, FiTrendingUp, FiEdit,
  FiAlertCircle, FiStar, FiFlag, FiSend, FiGrid
} from 'react-icons/fi';

const AdminPanel = ({ onMenuClick }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [activeProductSubPage, setActiveProductSubPage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(false);
  
  // Bildiriş state-ləri
  const [todayNotifications, setTodayNotifications] = useState([]);
  const [todayUnreadCount, setTodayUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    todayOrders, 
    loading: ordersLoading, 
    error: ordersError,
    refreshOrders,
    todayStr
  } = useOrders();

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const cartRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuBtnRef = useRef(null);
  const searchInputRef = useRef(null);
  const productsDropdownRef = useRef(null);

  // Demo bildiriş məlumatları
  const getDemoNotifications = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 1,
        title: 'Yeni sifariş',
        message: 'Əli Hüseynov 245 nömrəli sifarişi tamamladı',
        type: 'order',
        createdAt: new Date(today.setHours(9, 30, 0, 0)),
        read: false,
        actionUrl: '/admin/orders/245'
      },
      {
        id: 2,
        title: 'Yeni mesaj',
        message: 'Günel Məmmədova sizə yeni mesaj göndərdi',
        type: 'message',
        createdAt: new Date(today.setHours(10, 15, 0, 0)),
        read: false,
        actionUrl: '/admin/messages'
      },
      {
        id: 3,
        title: 'Yeni istifadəçi',
        message: 'Rəşad Əliyev platformada qeydiyyatdan keçdi',
        type: 'user',
        createdAt: new Date(today.setHours(11, 45, 0, 0)),
        read: true,
        actionUrl: '/admin/users'
      },
      {
        id: 4,
        title: 'Sistem yeniləməsi',
        message: 'Sistem 2.3.0 versiyasına yeniləndi',
        type: 'system',
        createdAt: yesterday,
        read: true,
        actionUrl: '/admin/settings'
      }
    ];
  };

  // Bildirişləri yüklə
  const loadTodayNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const allNotifications = getDemoNotifications();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filtered = allNotifications.filter(notif => {
        const notifDate = new Date(notif.createdAt);
        notifDate.setHours(0, 0, 0, 0);
        return notifDate.getTime() === today.getTime();
      });
      
      setTodayNotifications(filtered);
      setTodayUnreadCount(filtered.filter(n => !n.read).length);
    } catch (error) {
      console.error('Bildiriş xətası:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayNotifications();
    const interval = setInterval(loadTodayNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = (notificationId) => {
    setTodayNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setTodayUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setTodayNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setTodayUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    const notificationToDelete = todayNotifications.find(n => n.id === notificationId);
    setTodayNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (notificationToDelete && !notificationToDelete.read) {
      setTodayUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 16 };
    switch(type) {
      case 'order': return <FiShoppingCart {...iconProps} />;
      case 'message': return <FiMessageSquare {...iconProps} />;
      case 'user': return <FiUser {...iconProps} />;
      case 'system': return <FiSettings {...iconProps} />;
      default: return <FiBell {...iconProps} />;
    }
  };

  const formatNotificationTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'İndi';
    if (diffMins < 60) return `${diffMins} dəq əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    return date.toLocaleDateString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setActivePage('dashboard');
    else if (path.includes('/orders')) setActivePage('orders');
    else if (path.includes('/products/list')) {
      setActivePage('products');
      setActiveProductSubPage('list');
    }
    else if (path.includes('/products/upload')) {
      setActivePage('products');
      setActiveProductSubPage('upload');
    }
    else if (path.includes('/profile')) setActivePage('profile');
    else if (path.includes('/messages')) setActivePage('messages');
    else if (path.includes('/notifications')) setActivePage('notifications');
    else if (path.includes('/authentication')) setActivePage('authentication');
    else if (path.includes('/users')) setActivePage('users');
    else if (path.includes('/categories')) setActivePage('categories');
    else if (path.includes('/campaigns')) setActivePage('campaigns');
    else if (path.includes('/blog')) setActivePage('blog');
    else setActivePage('dashboard');
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavbarVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      
      if (width > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
        setProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    console.log('Axtarış:', searchTerm);
    setSearchOpen(false);
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setProductsDropdownOpen(false);
    if (onMenuClick) onMenuClick();
  };

  const handleOverlayClick = () => {
    setSidebarOpen(false);
    setProductsDropdownOpen(false);
  };

  const handleNotificationsClick = () => {
    setNotificationsOpen(!notificationsOpen);
    setProfileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  };

  const handleCartClick = () => {
    setCartOpen(!cartOpen);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  };

  const handleRemoveOrder = (orderId) => {
    console.log(`Sifariş silindi: ${orderId}`);
    refreshOrders();
  };

  const handleClearAllOrders = () => {
    console.log('Bütün sifarişlər təmizləndi');
    refreshOrders();
  };

  const handleProfileClick = () => {
    setProfileOpen(!profileOpen);
    setNotificationsOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setCartOpen(false);
  };

  const handleProductsClick = () => {
    setProductsDropdownOpen(!productsDropdownOpen);
  };

  const handleProductSubPageChange = (subPage) => {
    setActivePage('products');
    setActiveProductSubPage(subPage);
    setProductsDropdownOpen(false);
    
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
    
    if (subPage === 'list') {
      navigate('/admin/products/list');
    } else if (subPage === 'upload') {
      navigate('/admin/products/upload');
    }
    
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setActiveProductSubPage(null);
    setProductsDropdownOpen(false);
    
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
    
    switch(page) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'orders':
        navigate('/admin/orders');
        refreshOrders();
        break;
      case 'profile':
        navigate('/admin/profile');
        break;
      case 'messages':
        navigate('/admin/messages');
        break;
      case 'notifications':
        navigate('/admin/notifications');
        break;
      case 'authentication':
        navigate('/admin/authentication');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'categories':
        navigate('/admin/categories');
        break;
      case 'campaigns':
        navigate('/admin/campaigns');
        break;
      case 'blog':
        navigate('/admin/blog');
        break;
      default:
        navigate('/admin/dashboard');
    }
    
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  };

  const goToAllOrders = () => {
    setCartOpen(false);
    handlePageChange('orders');
  };

  const handleLogout = () => {
    console.log('Çıxış edilir...');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  const renderContent = () => {
    if (activePage === 'blog') return <Blog />;
    if (activePage === 'users') return <Users />;
    if (activePage === 'notifications') return <NotificationCenter />;
    if (activePage === 'categories') return <Categories />;
    return <Outlet />;
  };

  const renderNotificationDropdown = () => (
    <div className="dropdown notification-dropdown">
      <div className="dropdown-header">
        <h3>Bugünkü Bildirişlər</h3>
        <span className="notification-date">{new Date().toLocaleDateString('az-AZ')}</span>
        {todayUnreadCount > 0 && (
          <span className="mark-read" onClick={markAllNotificationsAsRead}>
            Hamısını oxundu işarələ
          </span>
        )}
      </div>
      <div className="dropdown-body">
        {notificationsLoading ? (
          <div className="loading-state">Yüklənir...</div>
        ) : todayNotifications.length > 0 ? (
          todayNotifications.map((notification) => (
            <div 
              className={`notification-item ${!notification.read ? 'unread' : ''}`} 
              key={notification.id}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className={`notification-icon type-${notification.type}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p className="notification-text">{notification.message}</p>
                <span className="notification-time">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </div>
              <button 
                className="notification-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <FiXCircle size={14} />
              </button>
              {!notification.read && <div className="notification-dot"></div>}
            </div>
          ))
        ) : (
          <div className="empty-state notification-empty">
            Bugün üçün bildiriş yoxdur
          </div>
        )}
      </div>
      <div className="dropdown-footer">
        <button type="button" className="view-all" onClick={() => handlePageChange('notifications')}>
          Bütün Bildirişlər
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <nav className={`admin-navbar ${navbarVisible ? 'navbar-visible' : ''}`}>
        <div className="navbar-left">
          <button type="button" className="menu-btn" onClick={handleMenuClick} ref={menuBtnRef}>
            <FiMenu />
          </button>
          
          <div className={`search-container ${searchOpen ? 'active' : ''}`} ref={searchRef}>
            <button type="button" className="search-toggle" onClick={handleSearchToggle}>
              <FiSearch />
            </button>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                name="search"
                placeholder="Axtarış..."
                className="search-input"
                ref={searchInputRef}
              />
            </form>
          </div>
        </div>

        <div className="navbar-right">
          <div className="cart-wrapper" ref={cartRef}>
            <button type="button" className="cart-btn" onClick={handleCartClick}>
              <FiCartIcon />
              {todayOrders.length > 0 && (
                <span className="cart-badge">{todayOrders.length}</span>
              )}
            </button>
            {cartOpen && (
              <div className="dropdown cart-dropdown">
                <div className="dropdown-header">
                  <h3>Bugünkü Sifarişlər</h3>
                  <span className="order-date">{todayStr}</span>
                  {todayOrders.length > 0 && (
                    <span className="clear-all" onClick={handleClearAllOrders}>Hamısını təmizlə</span>
                  )}
                </div>
                <div className="dropdown-body">
                  {ordersLoading ? (
                    <div className="loading-state">Yüklənir...</div>
                  ) : ordersError ? (
                    <div className="error-state">{ordersError}</div>
                  ) : todayOrders.length > 0 ? (
                    todayOrders.map((order) => (
                      <div className="cart-item" key={order.id}>
                        <div className="cart-item-info">
                          <span className="cart-item-id">{order.id}</span>
                          <span className="cart-item-customer">{order.customer}</span>
                        </div>
                        <div className="cart-item-details">
                          <span className="cart-item-time">{order.time}</span>
                          <span className="cart-item-amount">₼{order.amount.toFixed(2)}</span>
                        </div>
                        <button 
                          type="button"
                          className="cart-item-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOrder(order.id);
                          }}
                        >
                          <FiXCircle />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state cart-empty">Bugün heç bir sifariş yoxdur</div>
                  )}
                </div>
                <div className="dropdown-footer">
                  <button type="button" className="view-all-orders" onClick={goToAllOrders}>
                    Bütün Sifarişlər
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="notification-wrapper" ref={notificationsRef}>
            <button type="button" className="notification-btn" onClick={handleNotificationsClick}>
              <FiBell />
              {todayUnreadCount > 0 && (
                <span className="notification-badge">{todayUnreadCount}</span>
              )}
            </button>
            {notificationsOpen && renderNotificationDropdown()}
          </div>

          <div className="profile-wrapper" ref={profileRef}>
            <button type="button" className="profile-btn" onClick={handleProfileClick}>
              <div className="profile-info">
                <span className="profile-name">Admin User</span>
                <span className="profile-role">Super Admin</span>
              </div>
              <div className="profile-avatar">
                <div className="avatar-placeholder-custom">A</div>
              </div>
            </button>
            {profileOpen && (
              <div className="dropdown profile-dropdown">
                <div className="profile-header">
                  <div className="profile-header-avatar">
                    <div className="avatar-placeholder-custom large">A</div>
                  </div>
                  <div className="profile-header-info">
                    <h4>Admin User</h4>
                    <p>admin@example.com</p>
                  </div>
                </div>
                <div className="dropdown-body">
                  <button 
                    type="button" 
                    className={`dropdown-item ${activePage === 'profile' ? 'active-profile-item' : ''}`}
                    onClick={() => handlePageChange('profile')}
                  >
                    <FiUser /> Profilim
                  </button>
                  <button 
                    type="button" 
                    className={`dropdown-item ${activePage === 'messages' ? 'active-profile-item' : ''}`}
                    onClick={() => handlePageChange('messages')}
                  >
                    <FiMail /> Mesajlar
                  </button>
                  <button 
                    type="button" 
                    className={`dropdown-item ${activePage === 'notifications' ? 'active-profile-item' : ''}`}
                    onClick={() => handlePageChange('notifications')}
                  >
                    <FiBell /> Bildirişlər
                  </button>
                  <button 
                    type="button" 
                    className={`dropdown-item ${activePage === 'campaigns' ? 'active-profile-item' : ''}`}
                    onClick={() => handlePageChange('campaigns')}
                  >
                    <FiTrendingUp /> Kampaniyalar
                  </button>
                  <button 
                    type="button" 
                    className={`dropdown-item ${activePage === 'users' ? 'active-profile-item' : ''}`}
                    onClick={() => handlePageChange('users')}
                  >
                    <FiUsers /> İstifadəçilər
                  </button>
                </div>
                <div className="dropdown-footer">
                  <button type="button" className="logout-btn" onClick={handleLogout}>
                    <FiLogOut /> Çıxış
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {(isMobile || isTablet) && (
        <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={handleOverlayClick} />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">ASGAROV</h2>
          <p className="sidebar-subtitle">Əsas səhifələr</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => handlePageChange('dashboard')}
              >
                <FiBarChart2 /> Dashboard
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'authentication' ? 'active' : ''}`}
                onClick={() => handlePageChange('authentication')}
              >
                <FiUserCheck /> Authentication
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'users' ? 'active' : ''}`}
                onClick={() => handlePageChange('users')}
              >
                <FiUsers /> İstifadəçilər
              </button>
            </li>
            <li className="sidebar-dropdown-container" ref={productsDropdownRef}>
              <button 
                type="button"
                className={`sidebar-link dropdown-toggle ${activePage === 'products' ? 'active' : ''}`}
                onClick={handleProductsClick}
              >
                <FiPackage /> Məhsullar
                <FiChevronDown className={`dropdown-arrow ${productsDropdownOpen ? 'open' : ''}`} />
              </button>
              {productsDropdownOpen && (
                <ul className="sidebar-dropdown-menu">
                  <li>
                    <button
                      type="button"
                      className={`sidebar-dropdown-item ${activeProductSubPage === 'list' ? 'active' : ''}`}
                      onClick={() => handleProductSubPageChange('list')}
                    >
                      <FiList /> Məhsul siyahısı
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`sidebar-dropdown-item ${activeProductSubPage === 'upload' ? 'active' : ''}`}
                      onClick={() => handleProductSubPageChange('upload')}
                    >
                      <FiUpload /> Məhsul yüklə
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'categories' ? 'active' : ''}`}
                onClick={() => handlePageChange('categories')}
              >
                <FiGrid /> Kateqoriyalar
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'orders' ? 'active' : ''}`}
                onClick={() => handlePageChange('orders')}
              >
                <FiShoppingCart /> Bütün Sifarişlər
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'messages' ? 'active' : ''}`}
                onClick={() => handlePageChange('messages')}
              >
                <FiMessageSquare /> Mesajlar
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'notifications' ? 'active' : ''}`}
                onClick={() => handlePageChange('notifications')}
              >
                <FiBellIcon /> Bildirişlər
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'campaigns' ? 'active' : ''}`}
                onClick={() => handlePageChange('campaigns')}
              >
                <FiTrendingUp /> Kampaniyalar
              </button>
            </li>
            <li>
              <button 
                type="button"
                className={`sidebar-link ${activePage === 'blog' ? 'active' : ''}`}
                onClick={() => handlePageChange('blog')}
              >
                <FiEdit /> Bloq
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className={`main-content ${sidebarOpen && !isMobile && !isTablet ? 'sidebar-open' : ''}`}>
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;