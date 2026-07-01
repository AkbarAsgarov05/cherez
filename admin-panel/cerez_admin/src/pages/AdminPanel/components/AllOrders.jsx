import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AllOrders.css';
import Pagination from './Pagination';
import { useOrders } from '../../../hooks/useOrders';
import { 
  FiSearch, FiFilter, FiDownload, FiPrinter, 
  FiEye, FiEdit, FiTrash2, FiPackage,
  FiRefreshCw, FiX, FiCheck, FiClock, FiAlertCircle,
  FiCalendar, FiDollarSign, FiChevronDown
} from 'react-icons/fi';

// ✅ API URL - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

const AllOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ========== STATE ==========
  const { 
    orders, 
    loading, 
    error, 
    refreshOrders, 
    updateOrder, 
    deleteOrder,
    calculateStats
  } = useOrders();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  const [viewModal, setViewModal] = useState({ show: false, order: null });
  const [editModal, setEditModal] = useState({ show: false, order: null });
  const [statusModal, setStatusModal] = useState({ show: false, order: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, orderId: null });
  const [productsModal, setProductsModal] = useState({ show: false, order: null });
  
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef(null);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    processing: 0,
    cancelled: 0,
    totalAmount: 0
  });

  const ordersPerPage = 20;

  // ========== MƏHSULUN NÖVÜNÜ TƏYİN ET (ad əsasında) ==========
  const getUnitTypeFromProductName = (productName) => {
    if (!productName) return 'kg';
    
    const pieceProducts = [
      'keju', 'pendir', 'yumurta', 'süd', 'qaymaq', 'çörək',
      'kərə yağı', 'kere yagi', 'mast', 'qatıq', 'ayran', 'kefir',
      'şirniyyat', 'tort', 'piroq', 'dondurma', 'konserv', 'koka kola',
      'fanta', 'sprite', 'su', 'mina su', 'qazlı su', 'limonad'
    ];
    
    const lowerName = productName.toLowerCase();
    if (pieceProducts.some(name => lowerName.includes(name))) {
      return 'piece';
    }
    return 'kg';
  };

  // ========== MƏHSUL MƏLUMATLARINI HESABLA ==========
  const getProductDisplayData = (product) => {
    const unitType = product?.unitType;
    let rawQuantity = parseFloat(product?.quantity || product?.weight || 0);
    const displayQuantity = product?.displayQuantity;
    const price = parseFloat(product?.price) || 0;
    
    if (displayQuantity !== undefined && !isNaN(displayQuantity) && displayQuantity > 0) {
      if (unitType === 'kg') {
        const kgValue = displayQuantity;
        const formattedQuantity = Number.isInteger(kgValue) ? `${kgValue} kq` : `${kgValue.toFixed(2)} kq`;
        return { formattedQuantity, totalPrice: price * kgValue, price };
      } else {
        return { formattedQuantity: `${displayQuantity} ədəd`, totalPrice: price * displayQuantity, price };
      }
    }
    
    let finalUnitType = unitType;
    if (!finalUnitType) {
      finalUnitType = getUnitTypeFromProductName(product?.name);
    }
    
    if (finalUnitType === 'kg') {
      let kgValue = rawQuantity;
      
      if (rawQuantity >= 1000) {
        kgValue = rawQuantity / 1000;
      }
      else if (rawQuantity >= 10 && rawQuantity <= 100) {
        kgValue = rawQuantity / 10;
      }
      
      const formattedQuantity = Number.isInteger(kgValue) ? `${kgValue} kq` : `${kgValue.toFixed(2)} kq`;
      const totalPrice = price * kgValue;
      return { formattedQuantity, totalPrice, price };
    }
    
    const formattedQuantity = `${rawQuantity} ədəd`;
    const totalPrice = price * rawQuantity;
    return { formattedQuantity, totalPrice, price };
  };

  // ========== MƏHSULLARI GÖSTƏR ==========
  const renderProductsList = (products) => {
    if (!products || products.length === 0) {
      return <p className="ao-no-products">Məhsul məlumatı yoxdur</p>;
    }
    
    return (
      <div className="ao-products-list">
        <table className="ao-products-table">
          <thead>
            <tr>
              <th>Məhsul adı</th>
              <th>Miqdar</th>
              <th>Qiymət (AZN)</th>
              <th>Cəmi (AZN)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const { formattedQuantity, totalPrice, price } = getProductDisplayData(product);
              
              return (
                <tr key={idx}>
                  <td className="ao-product-name">{product.name}</td>
                  <td className="ao-product-quantity">{formattedQuantity}</td>
                  <td className="ao-product-price">{price.toFixed(2)} AZN</td>
                  <td className="ao-product-total">{totalPrice.toFixed(2)} AZN</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="ao-products-total-label">Ümumi:</td>
              <td className="ao-products-total-value">
                {products.reduce((sum, product) => {
                  const { totalPrice } = getProductDisplayData(product);
                  return sum + totalPrice;
                }, 0).toFixed(2)} AZN
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // ========== MODAL FUNKSIYALARI ==========
  const handleViewOrder = (order) => {
    setViewModal({ show: true, order });
  };

  const closeViewModal = () => {
    setViewModal({ show: false, order: null });
  };

  const handleViewProducts = (order) => {
    setProductsModal({ show: true, order });
  };

  const closeProductsModal = () => {
    setProductsModal({ show: false, order: null });
  };

  const handleEditOrder = (order) => {
    setEditModal({ 
      show: true, 
      order: { ...order }
    });
  };

  const handleEditChange = (field, value) => {
    setEditModal({
      ...editModal,
      order: {
        ...editModal.order,
        [field]: value
      }
    });
  };

  const saveEdit = () => {
    const updatedFields = {
      customer: editModal.order.customer,
      phone: editModal.order.phone,
      amount: parseFloat(editModal.order.amount),
      address: editModal.order.address,
      paymentMethod: editModal.order.paymentMethod,
      items: parseInt(editModal.order.items) || 0
    };
    updateOrder(editModal.order.id, updatedFields);
    setEditModal({ show: false, order: null });
  };

  const closeEditModal = () => {
    setEditModal({ show: false, order: null });
  };

  const handleStatusChange = (order) => {
    setStatusModal({ show: true, order: { ...order } });
  };

  // ✅ DÜZƏLDİLMİŞ - API_URL istifadə edir
  const handleStatusSelect = async (newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/orders/${statusModal.order.id}/status`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Status dəyişmə xətası');
      }
      
      const updatedOrder = await response.json();
      
      // Sifarişləri yenilə
      refreshOrders();
      
      if (newStatus === 'completed') {
        window.dispatchEvent(new CustomEvent('orderCompleted', { 
          detail: { 
            orderId: statusModal.order.id, 
            phone: statusModal.order.phone,
            amount: statusModal.order.amount
          }
        }));
        console.log('✅ orderCompleted hadisəsi göndərildi:', statusModal.order.id);
      }
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
      
      setStatusModal({ show: false, order: null });
    } catch (error) {
      console.error('Status dəyişmə xətası:', error);
      alert('Status dəyişdirilərkən xəta baş verdi!');
    }
  };

  const closeStatusModal = () => {
    setStatusModal({ show: false, order: null });
  };

  const handleDeleteClick = (orderId) => {
    setDeleteModal({ show: true, orderId });
  };

  const confirmDelete = () => {
    deleteOrder(deleteModal.orderId);
    
    if (currentOrders.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    
    setDeleteModal({ show: false, orderId: null });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, orderId: null });
  };

  // Ödəniş dropdown xaricə klik
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setPaymentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // URL-dən filter parametrlərini oxu
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && ['completed', 'pending', 'processing', 'cancelled'].includes(statusFromUrl)) {
      setFilterStatus(statusFromUrl);
    }
    
    const dateFromUrl = searchParams.get('date');
    if (dateFromUrl && ['today', 'week', 'month'].includes(dateFromUrl)) {
      setDateFilter(dateFromUrl);
    }
    
    const amountFromUrl = searchParams.get('amount');
    if (amountFromUrl && ['low', 'medium', 'high'].includes(amountFromUrl)) {
      setAmountFilter(amountFromUrl);
    }
    
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, []);

  const updateUrlParams = (status, date, amount, search) => {
    const newParams = new URLSearchParams();
    
    if (status && status !== 'all') {
      newParams.set('status', status);
    }
    if (date && date !== 'all') {
      newParams.set('date', date);
    }
    if (amount && amount !== 'all') {
      newParams.set('amount', amount);
    }
    if (search && search.trim() !== '') {
      newParams.set('search', search);
    }
    
    setSearchParams(newParams, { replace: false });
  };

  // ========== DROPDOWN ==========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // ========== STATISTIKALARI HESABLA ==========
  useEffect(() => {
    if (orders.length > 0) {
      const newStats = calculateStats();
      setStats(newStats);
    } else {
      setStats({
        total: 0,
        completed: 0,
        pending: 0,
        processing: 0,
        cancelled: 0,
        totalAmount: 0
      });
    }
  }, [orders, calculateStats]);

  // ========== FILTERLƏMƏ ==========
  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(order => {
        const idMatch = order.id?.toLowerCase().startsWith(term);
        const customerMatch = order.customer?.toLowerCase().startsWith(term);
        let cleanPhone = order.phone?.replace(/^\+994/, '').replace(/\s/g, '') || '';
        const cleanSearchTerm = term.replace(/\s/g, '');
        const phoneMatch = cleanPhone.startsWith(cleanSearchTerm);
        return idMatch || customerMatch || phoneMatch;
      });
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
      
      if (dateFilter === 'today') {
        filtered = filtered.filter(order => order.date === todayStr);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(order => {
          const [day, month, year] = order.date.split('.');
          const orderDate = new Date(year, month - 1, day);
          return orderDate >= weekAgo;
        });
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(order => {
          const [day, month, year] = order.date.split('.');
          const orderDate = new Date(year, month - 1, day);
          return orderDate >= monthAgo;
        });
      }
    }
    
    if (amountFilter !== 'all') {
      if (amountFilter === 'low') {
        filtered = filtered.filter(order => order.amount < 50);
      } else if (amountFilter === 'medium') {
        filtered = filtered.filter(order => order.amount >= 50 && order.amount < 100);
      } else if (amountFilter === 'high') {
        filtered = filtered.filter(order => order.amount >= 100);
      }
    }
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // ========== FILTER FUNKSIYALARI ==========
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrlParams(filterStatus, dateFilter, amountFilter, value);
  };
  
  const handleStatusFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(status, dateFilter, amountFilter, searchTerm);
  };
  
  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(filterStatus, date, amountFilter, searchTerm);
  };
  
  const handleAmountFilterChange = (amount) => {
    setAmountFilter(amount);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(filterStatus, dateFilter, amount, searchTerm);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // ========== EXPORT / PRINT / REFRESH / CLEAR ==========
  const handleExport = () => {
    const exportData = filteredOrders.map(order => ({
      'Sifariş ID': order.id,
      'Müştəri': order.customer,
      'Telefon': order.phone?.replace(/^\+994/, '') || '',
      'Məbləğ (AZN)': order.amount?.toFixed(2) || '0.00',
      'Çatdırılma ünvanı': order.address || 'Daxil edilməyib',
      'Ödəniş metodu': order.paymentMethod === 'card' ? 'Kart ilə ödəniş' : 
                        order.paymentMethod === 'online' ? 'Online ödəniş' : 'Nağd pul',
      'Tarix': order.date,
      'Saat': order.time,
      'Status': order.status === 'completed' ? 'Tamamlandı' :
                order.status === 'pending' ? 'Gözləyir' :
                order.status === 'processing' ? 'Hazırlanır' : 'Ləğv edildi',
      'Məhsul sayı': order.items
    }));
    
    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map(obj => Object.values(obj).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sifarisler_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`${exportData.length} sifariş export edildi!`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    const tableRows = filteredOrders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${order.customer}</td>
        <td>${order.phone?.replace(/^\+994/, '') || ''}</td>
        <td>₼${order.amount?.toFixed(2) || '0.00'}</td>
        <td>${order.address || '—'}</td>
        <td>${order.paymentMethod === 'card' ? 'Kart ilə ödəniş' : 
              order.paymentMethod === 'online' ? 'Online ödəniş' : 'Nağd pul'}</td>
        <td>${order.date}</td>
        <td>${order.status === 'completed' ? 'Tamamlandı' :
           order.status === 'pending' ? 'Gözləyir' :
           order.status === 'processing' ? 'Hazırlanır' : 'Ləğv edildi'}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Sifarişlər Siyahısı</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h1 { color: #333; margin-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .footer { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bütün Sifarişlər</h1>
            <p>Çap tarixi: ${new Date().toLocaleDateString('az-AZ')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sifariş ID</th>
                <th>Müştəri</th>
                <th>Telefon</th>
                <th>Məbləğ</th>
                <th>Çatdırılma ünvanı</th>
                <th>Ödəniş metodu</th>
                <th>Tarix</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            <p>Cəmi sifariş: ${filteredOrders.length}</p>
            <p>Ümumi məbləğ: ₼${filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setFilterStatus('all');
    setDateFilter('all');
    setAmountFilter('all');
    setSearchParams({}, { replace: true });
    refreshOrders();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateFilter('all');
    setAmountFilter('all');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  const getPaymentMethodLabel = (method) => {
    switch(method) {
      case 'cash': return 'Nağd pul';
      case 'card': return 'Kart ilə ödəniş';
      case 'online': return 'Online ödəniş';
      default: return 'Nağd pul';
    }
  };

  // ========== STATUS BADGE ==========
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="ao-status-badge ao-status-completed">Tamamlandı</span>;
      case 'pending':
        return <span className="ao-status-badge ao-status-pending">Gözləyir</span>;
      case 'processing':
        return <span className="ao-status-badge ao-status-processing">Hazırlanır</span>;
      case 'cancelled':
        return <span className="ao-status-badge ao-status-cancelled">Ləğv edildi</span>;
      default:
        return <span className="ao-status-badge">{status}</span>;
    }
  };

  // ========== LABEL FUNKSIYALARI ==========
  const getStatusLabel = (status) => {
    switch(status) {
      case 'all': return 'Bütün statuslar';
      case 'completed': return 'Tamamlanmış';
      case 'pending': return 'Gözləyən';
      case 'processing': return 'Hazırlanır';
      case 'cancelled': return 'Ləğv edilmiş';
      default: return 'Status';
    }
  };

  const getDateLabel = (date) => {
    switch(date) {
      case 'all': return 'Bütün tarixlər';
      case 'today': return 'Bugün';
      case 'week': return 'Son 7 gün';
      case 'month': return 'Son 30 gün';
      default: return 'Tarix';
    }
  };

  const getAmountLabel = (amount) => {
    switch(amount) {
      case 'all': return 'Bütün məbləğlər';
      case 'low': return '50 AZN -dən az';
      case 'medium': return '50 - 100 AZN';
      case 'high': return '100 AZN -dən çox';
      default: return 'Məbləğ';
    }
  };

  if (loading) {
    return (
      <div className="ao-container">
        <div className="ao-loading-container">
          <div className="ao-loading-spinner"></div>
          <p className="ao-loading-text">Sifarişlər yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ao-container">
        <div className="ao-error-container">
          <p>{error}</p>
          <button onClick={handleRefresh}>Yenidən cəhd edin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ao-container">
      {/* Başlıq və əməliyyatlar */}
      <div className="ao-header">
        <div>
          <h1 className="ao-page-title">Bütün Sifarişlər</h1>
          <p className="ao-orders-count">Cəmi {stats.total} sifariş</p>
        </div>
        <div className="ao-header-actions">
          <button className="ao-action-btn ao-refresh-btn" onClick={handleRefresh} title="Yenilə">
            <FiRefreshCw /> Yenilə
          </button>
          <button className="ao-action-btn ao-export-btn" onClick={handleExport}>
            <FiDownload /> Export
          </button>
          <button className="ao-action-btn ao-print-btn" onClick={handlePrint}>
            <FiPrinter /> Çap et
          </button>
        </div>
      </div>

      {/* FILTERLER */}
      <div className="ao-compact-filters" ref={dropdownRef}>
        <div className="ao-search-wrapper">
          <FiSearch className="ao-search-icon" />
          <input
            type="text"
            placeholder="Axtarış (ID, müştəri, telefon...) - Başdan uyğunluq"
            value={searchTerm}
            onChange={handleSearch}
            className="ao-search-input"
          />
          {searchTerm && (
            <FiX className="ao-clear-search" onClick={() => {
              setSearchTerm('');
              updateUrlParams(filterStatus, dateFilter, amountFilter, '');
            }} />
          )}
        </div>

        <div className="ao-filter-buttons">
          <div className="ao-filter-dropdown">
            <button 
              className={`ao-filter-btn ${filterStatus !== 'all' ? 'ao-active' : ''}`}
              onClick={() => toggleDropdown('status')}
            >
              <FiFilter />
              <span>{getStatusLabel(filterStatus)}</span>
              <FiChevronDown className={`ao-dropdown-arrow ${openDropdown === 'status' ? 'ao-open' : ''}`} />
            </button>
            {openDropdown === 'status' && (
              <div className="ao-dropdown-menu">
                <div 
                  className={`ao-dropdown-item ${filterStatus === 'all' ? 'ao-selected' : ''}`}
                  onClick={() => handleStatusFilterChange('all')}
                >
                  Bütün statuslar
                </div>
                <div 
                  className={`ao-dropdown-item ${filterStatus === 'completed' ? 'ao-selected' : ''}`}
                  onClick={() => handleStatusFilterChange('completed')}
                >
                  Tamamlanmış
                </div>
                <div 
                  className={`ao-dropdown-item ${filterStatus === 'processing' ? 'ao-selected' : ''}`}
                  onClick={() => handleStatusFilterChange('processing')}
                >
                  Hazırlanır
                </div>
                <div 
                  className={`ao-dropdown-item ${filterStatus === 'pending' ? 'ao-selected' : ''}`}
                  onClick={() => handleStatusFilterChange('pending')}
                >
                  Gözləyən
                </div>
                <div 
                  className={`ao-dropdown-item ${filterStatus === 'cancelled' ? 'ao-selected' : ''}`}
                  onClick={() => handleStatusFilterChange('cancelled')}
                >
                  Ləğv edilmiş
                </div>
              </div>
            )}
          </div>

          <div className="ao-filter-dropdown">
            <button 
              className={`ao-filter-btn ${dateFilter !== 'all' ? 'ao-active' : ''}`}
              onClick={() => toggleDropdown('date')}
            >
              <FiCalendar />
              <span>{getDateLabel(dateFilter)}</span>
              <FiChevronDown className={`ao-dropdown-arrow ${openDropdown === 'date' ? 'ao-open' : ''}`} />
            </button>
            {openDropdown === 'date' && (
              <div className="ao-dropdown-menu">
                <div 
                  className={`ao-dropdown-item ${dateFilter === 'all' ? 'ao-selected' : ''}`}
                  onClick={() => handleDateFilterChange('all')}
                >
                  Bütün tarixlər
                </div>
                <div 
                  className={`ao-dropdown-item ${dateFilter === 'today' ? 'ao-selected' : ''}`}
                  onClick={() => handleDateFilterChange('today')}
                >
                  Bugün
                </div>
                <div 
                  className={`ao-dropdown-item ${dateFilter === 'week' ? 'ao-selected' : ''}`}
                  onClick={() => handleDateFilterChange('week')}
                >
                  Son 7 gün
                </div>
                <div 
                  className={`ao-dropdown-item ${dateFilter === 'month' ? 'ao-selected' : ''}`}
                  onClick={() => handleDateFilterChange('month')}
                >
                  Son 30 gün
                </div>
              </div>
            )}
          </div>

          <div className="ao-filter-dropdown">
            <button 
              className={`ao-filter-btn ${amountFilter !== 'all' ? 'ao-active' : ''}`}
              onClick={() => toggleDropdown('amount')}
            >
              <FiDollarSign />
              <span>{getAmountLabel(amountFilter)}</span>
              <FiChevronDown className={`ao-dropdown-arrow ${openDropdown === 'amount' ? 'ao-open' : ''}`} />
            </button>
            {openDropdown === 'amount' && (
              <div className="ao-dropdown-menu">
                <div 
                  className={`ao-dropdown-item ${amountFilter === 'all' ? 'ao-selected' : ''}`}
                  onClick={() => handleAmountFilterChange('all')}
                >
                  Bütün məbləğlər
                </div>
                <div 
                  className={`ao-dropdown-item ${amountFilter === 'low' ? 'ao-selected' : ''}`}
                  onClick={() => handleAmountFilterChange('low')}
                >
                  50 AZN -dən az
                </div>
                <div 
                  className={`ao-dropdown-item ${amountFilter === 'medium' ? 'ao-selected' : ''}`}
                  onClick={() => handleAmountFilterChange('medium')}
                >
                  50 - 100 AZN
                </div>
                <div 
                  className={`ao-dropdown-item ${amountFilter === 'high' ? 'ao-selected' : ''}`}
                  onClick={() => handleAmountFilterChange('high')}
                >
                  100 AZN -dən çox
                </div>
              </div>
            )}
          </div>

          {(searchTerm || filterStatus !== 'all' || dateFilter !== 'all' || amountFilter !== 'all') && (
            <button className="ao-filter-btn ao-clear-all-btn" onClick={clearFilters}>
              <FiX /> Təmizlə
            </button>
          )}
        </div>

        {(searchTerm || filterStatus !== 'all' || dateFilter !== 'all' || amountFilter !== 'all') && (
          <div className="ao-compact-active-filters">
            {searchTerm && (
              <span className="ao-compact-active-filter">
                "{searchTerm}"
                <FiX onClick={() => {
                  setSearchTerm('');
                  updateUrlParams(filterStatus, dateFilter, amountFilter, '');
                }} />
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="ao-compact-active-filter">
                {filterStatus === 'completed' ? 'Tamamlanmış' :
                 filterStatus === 'pending' ? 'Gözləyən' :
                 filterStatus === 'processing' ? 'Hazırlanır' : 'Ləğv edilmiş'}
                <FiX onClick={() => handleStatusFilterChange('all')} />
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="ao-compact-active-filter">
                {dateFilter === 'today' ? 'Bugün' :
                 dateFilter === 'week' ? 'Son 7 gün' : 'Son 30 gün'}
                <FiX onClick={() => handleDateFilterChange('all')} />
              </span>
            )}
            {amountFilter !== 'all' && (
              <span className="ao-compact-active-filter">
                {amountFilter === 'low' ? '< 50₼' :
                 amountFilter === 'medium' ? '50-100₼' : '> 100₼'}
                <FiX onClick={() => handleAmountFilterChange('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* STATISTIKA KARTLARI */}
      <div className="ao-stats-cards">
        <div className="ao-stat-card">
          <span className="ao-stat-label">Ümumi sifariş</span>
          <span className="ao-stat-value">{stats.total}</span>
        </div>
        <div className="ao-stat-card">
          <span className="ao-stat-label">Tamamlanmış</span>
          <span className="ao-stat-value">{stats.completed}</span>
        </div>
        <div className="ao-stat-card">
          <span className="ao-stat-label">Hazırlanır</span>
          <span className="ao-stat-value">{stats.processing}</span>
        </div>
        <div className="ao-stat-card">
          <span className="ao-stat-label">Gözləyən</span>
          <span className="ao-stat-value">{stats.pending}</span>
        </div>
        <div className="ao-stat-card">
          <span className="ao-stat-label">Ləğv edilmiş</span>
          <span className="ao-stat-value">{stats.cancelled}</span>
        </div>
        <div className="ao-stat-card">
          <span className="ao-stat-label">Ümumi məbləğ</span>
          <span className="ao-stat-value">₼{stats.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Nəticə sayı */}
      <div className="ao-results-info">
        <p>Cəmi <strong>{filteredOrders.length}</strong> sifariş tapıldı</p>
        {filteredOrders.length > 0 && (
          <p className="ao-results-detail">Səhifə: {currentPage} / {totalPages}</p>
        )}
      </div>

      {/* Sifarişlər cədvəli */}
      <div className="ao-table-wrapper">
        {filteredOrders.length === 0 ? (
          <div className="ao-no-data">
            <p>Heç bir sifariş tapılmadı</p>
            <button className="ao-clear-filters-btn" onClick={clearFilters}>Filtrləri təmizlə</button>
          </div>
        ) : (
          <table className="ao-table">
            <thead>
              <tr>
                <th>Sifariş ID</th>
                <th>Müştəri</th>
                <th>Telefon</th>
                <th>Məbləğ</th>
                <th>Çatdırılma ünvanı</th>
                <th>Ödəniş metodu</th>
                <th>Tarix</th>
                <th>Status</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="ao-order-id">{order.id}</td>
                  <td className="ao-customer-name">{order.customer}</td>
                  <td className="ao-customer-phone">{order.phone?.replace(/^\+994/, '') || ''}</td>
                  <td className="ao-order-amount">₼{order.amount?.toFixed(2) || '0.00'}</td>
                  <td className="ao-address-cell">
                    <div className="ao-address-info" title={order.address || "Ünvan daxil edilməyib"}>
                      {order.address || "—"}
                    </div>
                  </td>
                  <td className="ao-payment-cell">
                    <span className={`ao-payment-badge 
                      ${order.paymentMethod === 'card' ? 'ao-payment-card' : 
                        order.paymentMethod === 'online' ? 'ao-payment-online' : 'ao-payment-cash'}`}>
                      {order.paymentMethod === 'card' ? 'Kart ilə ödəniş' : 
                        order.paymentMethod === 'online' ? 'Online ödəniş' : 'Nağd pul'}
                    </span>
                    </td>
                  <td>
                    <div className="ao-date-info">
                      <span>{order.date}</span>
                      <small>{order.time}</small>
                    </div>
                    </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div className="ao-action-buttons">
                      <button 
                        className="ao-action-btn ao-view-btn" 
                        onClick={() => handleViewOrder(order)}
                        title="Bax"
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="ao-action-btn ao-products-btn" 
                        onClick={() => handleViewProducts(order)}
                        title="Məhsulları gör"
                      >
                        <FiPackage />
                      </button>
                      <button 
                        className="ao-action-btn ao-edit-btn" 
                        onClick={() => handleEditOrder(order)}
                        title="Redaktə et"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="ao-action-btn ao-status-btn" 
                        onClick={() => handleStatusChange(order)}
                        title="Status dəyiş"
                      >
                        <FiFilter />
                      </button>
                      <button 
                        className="ao-action-btn ao-delete-btn" 
                        onClick={() => handleDeleteClick(order.id)}
                        title="Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vahid Pagination Komponenti */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageParamName="page"
          scrollToTop={true}
        />
      )}

      {/* ========== VIEW MODAL ========== */}
      {viewModal.show && (
        <div className="ao-modal-overlay" onClick={closeViewModal}>
          <div className="ao-modal-content ao-view-modal" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2>Sifariş Detalları</h2>
              <button className="ao-modal-close" onClick={closeViewModal}>
                <FiX />
              </button>
            </div>
            <div className="ao-modal-body">
              <div className="ao-detail-row">
                <span className="ao-detail-label">Sifariş ID:</span>
                <span className="ao-detail-value">{viewModal.order.id}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Müştəri:</span>
                <span className="ao-detail-value">{viewModal.order.customer}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Telefon:</span>
                <span className="ao-detail-value">{viewModal.order.phone?.replace(/^\+994/, '') || ''}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Məbləğ:</span>
                <span className="ao-detail-value ao-amount">₼{viewModal.order.amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Çatdırılma ünvanı:</span>
                <span className="ao-detail-value">{viewModal.order.address || "Daxil edilməyib"}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Ödəniş metodu:</span>
                <span className="ao-detail-value">
                  <span className={`ao-payment-badge 
                    ${viewModal.order.paymentMethod === 'card' ? 'ao-payment-card' : 
                      viewModal.order.paymentMethod === 'online' ? 'ao-payment-online' : 'ao-payment-cash'}`}>
                    {viewModal.order.paymentMethod === 'card' ? 'Kart ilə ödəniş' : 
                      viewModal.order.paymentMethod === 'online' ? 'Online ödəniş' : 'Nağd pul'}
                  </span>
                </span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Tarix:</span>
                <span className="ao-detail-value">{viewModal.order.date} {viewModal.order.time}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Status:</span>
                <span className="ao-detail-value">{getStatusBadge(viewModal.order.status)}</span>
              </div>
              <div className="ao-detail-row">
                <span className="ao-detail-label">Məhsul sayı:</span>
                <span className="ao-detail-value">{viewModal.order.items}</span>
              </div>
              {viewModal.order.note && (
                <div className="ao-detail-row">
                  <span className="ao-detail-label">Qeyd:</span>
                  <span className="ao-detail-value ao-note">{viewModal.order.note}</span>
                </div>
              )}
            </div>
            <div className="ao-modal-footer">
              <button className="ao-modal-btn ao-primary" onClick={closeViewModal}>Bağla</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== PRODUCTS MODAL ========== */}
      {productsModal.show && (
        <div className="ao-modal-overlay" onClick={closeProductsModal}>
          <div className="ao-modal-content ao-products-modal" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2>Sifariş Məhsulları</h2>
              <button className="ao-modal-close" onClick={closeProductsModal}>
                <FiX />
              </button>
            </div>
            <div className="ao-modal-body">
              <div className="ao-order-info">
                <div className="ao-order-info-row">
                  <span className="ao-order-info-label">Sifariş ID:</span>
                  <span className="ao-order-info-value">{productsModal.order?.id}</span>
                </div>
                <div className="ao-order-info-row">
                  <span className="ao-order-info-label">Müştəri:</span>
                  <span className="ao-order-info-value">{productsModal.order?.customer}</span>
                </div>
                <div className="ao-order-info-row">
                  <span className="ao-order-info-label">Tarix:</span>
                  <span className="ao-order-info-value">{productsModal.order?.date} {productsModal.order?.time}</span>
                </div>
                <div className="ao-order-info-row">
                  <span className="ao-order-info-label">Ümumi məbləğ:</span>
                  <span className="ao-order-info-value ao-amount">₼{productsModal.order?.amount?.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="ao-products-section">
                <h3>Sifariş Edilən Məhsullar</h3>
                {renderProductsList(productsModal.order?.products)}
              </div>
            </div>
            <div className="ao-modal-footer">
              <button className="ao-modal-btn ao-primary" onClick={closeProductsModal}>Bağla</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {editModal.show && (
        <div className="ao-modal-overlay" onClick={closeEditModal}>
          <div className="ao-modal-content ao-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2>Sifariş Redaktə Et</h2>
              <button className="ao-modal-close" onClick={closeEditModal}>
                <FiX />
              </button>
            </div>
            <div className="ao-modal-body">
              <div className="ao-form-group">
                <label>Sifariş ID:</label>
                <div className="ao-order-id-display">{editModal.order.id}</div>
              </div>
              
              <div className="ao-form-group">
                <label>Müştəri adı:</label>
                <input
                  type="text"
                  value={editModal.order.customer || ''}
                  onChange={(e) => handleEditChange('customer', e.target.value)}
                  className="ao-modal-input"
                  placeholder="Müştəri adı"
                />
              </div>

              <div className="ao-form-group">
                <label>Telefon nömrəsi:</label>
                <input
                  type="text"
                  value={editModal.order.phone?.replace(/^\+994/, '') || ''}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                  className="ao-modal-input"
                  placeholder="Telefon nömrəsi (051 234 56 78)"
                />
                <small className="ao-form-hint">+994 olmadan yazın</small>
              </div>

              <div className="ao-form-group">
                <label>Məbləğ (AZN):</label>
                <input
                  type="number"
                  step="0.01"
                  value={editModal.order.amount || 0}
                  onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                  className="ao-modal-input"
                  placeholder="Məbləğ"
                />
              </div>

              <div className="ao-form-group">
                <label>Məhsul sayı:</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={editModal.order.items || 0}
                  onChange={(e) => handleEditChange('items', parseInt(e.target.value) || 0)}
                  className="ao-modal-input"
                  placeholder="Məhsul sayı"
                />
                <small className="ao-form-hint">Sifarişdəki məhsulların ümumi sayı</small>
              </div>

              <div className="ao-form-group">
                <label>Çatdırılma ünvanı:</label>
                <textarea
                  value={editModal.order.address || ''}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  className="ao-modal-textarea"
                  placeholder="Çatdırılma ünvanı"
                  rows="3"
                />
              </div>

              <div className="ao-form-group">
                <label>Ödəniş metodu:</label>
                <div className="ao-payment-dropdown-wrapper" ref={paymentDropdownRef}>
                  <div 
                    className="ao-payment-dropdown-trigger"
                    onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                  >
                    <div className="ao-payment-selected">
                      <span className={`ao-payment-mini-badge 
                        ${editModal.order.paymentMethod === 'card' ? 'ao-payment-card' : 
                          editModal.order.paymentMethod === 'online' ? 'ao-payment-online' : 'ao-payment-cash'}`}>
                        {getPaymentMethodLabel(editModal.order.paymentMethod)}
                      </span>
                    </div>
                    <FiChevronDown className={`ao-payment-dropdown-icon ${paymentDropdownOpen ? 'ao-open' : ''}`} />
                  </div>
                  
                  {paymentDropdownOpen && (
                    <div className="ao-payment-dropdown-menu">
                      <div 
                        className={`ao-payment-dropdown-item ${editModal.order.paymentMethod === 'cash' ? 'ao-selected' : ''}`}
                        onClick={() => {
                          handleEditChange('paymentMethod', 'cash');
                          setPaymentDropdownOpen(false);
                        }}
                      >
                        <div className="ao-payment-dropdown-icon-cash">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M2 8C2 6.89543 2.89543 6 4 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V8Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M16 13C16 14.6569 14.6569 16 13 16C11.3431 16 10 14.6569 10 13C10 11.3431 11.3431 10 13 10C14.6569 10 16 11.3431 16 13Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <div className="ao-payment-dropdown-info">
                          <span className="ao-payment-dropdown-title">Nağd pul</span>
                          <span className="ao-payment-dropdown-desc">Çatdırılmada nağd ödəniş</span>
                        </div>
                        {editModal.order.paymentMethod === 'cash' && (
                          <svg className="ao-payment-dropdown-check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      
                      <div 
                        className={`ao-payment-dropdown-item ${editModal.order.paymentMethod === 'card' ? 'ao-selected' : ''}`}
                        onClick={() => {
                          handleEditChange('paymentMethod', 'card');
                          setPaymentDropdownOpen(false);
                        }}
                      >
                        <div className="ao-payment-dropdown-icon-card">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <div className="ao-payment-dropdown-info">
                          <span className="ao-payment-dropdown-title">Kart ilə ödəniş</span>
                          <span className="ao-payment-dropdown-desc">Çatdırılmada kartla ödəniş</span>
                        </div>
                        {editModal.order.paymentMethod === 'card' && (
                          <svg className="ao-payment-dropdown-check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      
                      <div 
                        className={`ao-payment-dropdown-item ${editModal.order.paymentMethod === 'online' ? 'ao-selected' : ''}`}
                        onClick={() => {
                          handleEditChange('paymentMethod', 'online');
                          setPaymentDropdownOpen(false);
                        }}
                      >
                        <div className="ao-payment-dropdown-icon-online">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M22 12C22 14.2091 20.2091 16 18 16H6C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8H18C20.2091 8 22 9.79086 22 12Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <div className="ao-payment-dropdown-info">
                          <span className="ao-payment-dropdown-title">Online ödəniş</span>
                          <span className="ao-payment-dropdown-desc">Kartla online (hesabdan çıxılır)</span>
                        </div>
                        {editModal.order.paymentMethod === 'online' && (
                          <svg className="ao-payment-dropdown-check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ao-modal-footer">
              <button className="ao-modal-btn ao-secondary" onClick={closeEditModal}>Ləğv et</button>
              <button className="ao-modal-btn ao-primary" onClick={saveEdit}>Yadda saxla</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== STATUS MODAL ========== */}
      {statusModal.show && (
        <div className="ao-modal-overlay" onClick={closeStatusModal}>
          <div className="ao-modal-content ao-status-modal" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2>Status Dəyiş</h2>
              <button className="ao-modal-close" onClick={closeStatusModal}>
                <FiX />
              </button>
            </div>
            <div className="ao-modal-body">
              <p className="ao-status-info">
                Sifariş ID: <strong>{statusModal.order.id}</strong>
              </p>
              <p className="ao-status-info">
                Cari status: {getStatusBadge(statusModal.order.status)}
              </p>
              <div className="ao-status-options">
                <button 
                  className={`ao-status-option ${statusModal.order.status === 'pending' ? 'ao-active' : ''}`}
                  onClick={() => handleStatusSelect('pending')}
                >
                  <FiClock /> Gözləyir
                </button>
                <button 
                  className={`ao-status-option ${statusModal.order.status === 'processing' ? 'ao-active' : ''}`}
                  onClick={() => handleStatusSelect('processing')}
                >
                  <FiRefreshCw /> Hazırlanır
                </button>
                <button 
                  className={`ao-status-option ${statusModal.order.status === 'completed' ? 'ao-active' : ''}`}
                  onClick={() => handleStatusSelect('completed')}
                >
                  <FiCheck /> Tamamlandı
                </button>
                <button 
                  className={`ao-status-option ${statusModal.order.status === 'cancelled' ? 'ao-active' : ''}`}
                  onClick={() => handleStatusSelect('cancelled')}
                >
                  <FiAlertCircle /> Ləğv edildi
                </button>
              </div>
            </div>
            <div className="ao-modal-footer">
              <button className="ao-modal-btn ao-secondary" onClick={closeStatusModal}>Bağla</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {deleteModal.show && (
        <div className="ao-modal-overlay" onClick={closeDeleteModal}>
          <div className="ao-modal-content ao-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h2>Sifarişi sil</h2>
              <button className="ao-modal-close" onClick={closeDeleteModal}>
                <FiX />
              </button>
            </div>
            <div className="ao-modal-body">
              <p className="ao-delete-warning">
                Sifariş ID: <strong>{deleteModal.orderId}</strong>
              </p>
              <p className="ao-delete-warning">
                Bu sifarişi silmək istədiyinizə əminsiniz?
              </p>
            </div>
            <div className="ao-modal-footer">
              <button className="ao-modal-btn ao-secondary" onClick={closeDeleteModal}>Ləğv et</button>
              <button className="ao-modal-btn ao-danger" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;