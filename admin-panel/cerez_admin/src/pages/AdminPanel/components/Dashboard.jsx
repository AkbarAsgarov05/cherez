import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  FiDollarSign, FiShoppingBag, FiClock, 
  FiPackage, FiAlertCircle, FiDownload, 
  FiTrendingUp, FiTrendingDown, FiRefreshCw,
  FiActivity, FiChevronLeft, FiChevronRight,
  FiChevronsLeft, FiChevronsRight, FiCalendar
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1200);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);

  // Backend-dən gələn məlumatlar
  const [salesData, setSalesData] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    totalSoldKg: 0,
    totalSoldPiece: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState({
    active: 0,
    new: 0,
    repeat: 0
  });
  const [stockAnalytics, setStockAnalytics] = useState({
    lowStock: [],
    outOfStock: [],
    highTurnover: []
  });

  // Helper: Tarix aralığını hesablama
  const getDateRange = (range, customStart = null, customEnd = null) => {
    if (customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    switch(range) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return { startDate: start, endDate: end };
  };

  // Backend-dən məlumat çəkmə
  const fetchDashboardData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      setKpiData({
        totalRevenue: data.kpi.totalRevenue,
        totalOrders: data.kpi.totalOrders,
        averageOrderValue: data.kpi.averageOrderValue,
        pendingOrders: data.kpi.pendingOrders,
        revenueGrowth: data.kpi.revenueGrowth,
        ordersGrowth: data.kpi.ordersGrowth,
        totalSoldKg: data.kpi.totalSoldKg || 0,
        totalSoldPiece: data.kpi.totalSoldPiece || 0
      });
      setSalesData(data.salesChart);
      setTopProducts(data.topProducts || []);
      setCustomerAnalytics(data.customerAnalytics);
      
      await fetchStockData();
      
    } catch (error) {
      console.error('Məlumat yüklənərkən xəta:', error);
      loadMockData(startDate, endDate);
    } finally {
      setLoading(false);
    }
  };

  // Stok məlumatları
  const fetchStockData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStockAnalytics({
        lowStock: response.data.lowStock || [],
        outOfStock: response.data.outOfStock || [],
        highTurnover: response.data.highTurnover || []
      });
    } catch (error) {
      console.error('Stok məlumatları xətası:', error);
      setStockAnalytics({
        lowStock: [],
        outOfStock: [],
        highTurnover: []
      });
    }
  };

  // Mock data (backend hazır olana qədər)
  const loadMockData = (startDate, endDate) => {
    setTimeout(() => {
      const mockSales = [];
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < Math.min(days, 30); i++) {
        mockSales.push({
          name: `${i + 1}`,
          revenue: Math.floor(4000 + Math.random() * 5000),
          orders: Math.floor(40 + Math.random() * 50)
        });
      }
      
      setSalesData(mockSales);
      setTopProducts([
        { name: 'Badam', sales: 450, revenue: 8325, unit: 'kq' },
        { name: 'Fındıq', sales: 380, revenue: 6042, unit: 'kq' },
        { name: 'Qoz', sales: 320, revenue: 4096, unit: 'kq' },
        { name: 'Kəşmiş', sales: 290, revenue: 2581, unit: 'kq' },
        { name: 'Püstə', sales: 240, revenue: 7680, unit: 'kq' },
      ]);
      setCustomerAnalytics({
        active: Math.floor(800 + Math.random() * 500),
        new: Math.floor(30 + Math.random() * 60),
        repeat: Math.floor(200 + Math.random() * 300)
      });
      setKpiData({
        totalRevenue: 458900,
        totalOrders: 4589,
        averageOrderValue: 100,
        pendingOrders: 45,
        revenueGrowth: 11.2,
        ordersGrowth: 10.5,
        totalSoldKg: 1250.50,
        totalSoldPiece: 345
      });
      setStockAnalytics({
        lowStock: [
          { name: 'Püstə', stock: '24.00', threshold: '30.00', category: 'Çərəzlər', unitLabel: 'kq' },
          { name: 'Ananas qurusu', stock: '17.00', threshold: '25.00', category: 'Quru meyvələr', unitLabel: 'kq' },
        ],
        outOfStock: [{ name: 'Şabalıd', category: 'Çərəzlər', unitLabel: 'kq' }],
        highTurnover: [
          { name: 'Badam', displayTurnover: '45.00', category: 'Çərəzlər', unitLabel: 'kq' },
          { name: 'Fındıq', displayTurnover: '38.00', category: 'Çərəzlər', unitLabel: 'kq' },
        ]
      });
    }, 500);
  };

  // Tarix dəyişdikdə məlumatları yenilə
  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      fetchDashboardData(selectedStartDate, selectedEndDate);
    } else {
      const { startDate, endDate } = getDateRange(dateRange);
      fetchDashboardData(startDate, endDate);
    }
  }, [dateRange, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Təqvim funksiyaları
  const applyCustomDateRange = () => {
    if (selectedStartDate && selectedEndDate) {
      fetchDashboardData(selectedStartDate, selectedEndDate);
      if (isMobile) setShowCustomDate(false);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const handleDateClick = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(selectedDate);
      setSelectedEndDate(null);
      setIsSelecting(true);
    } else if (selectedStartDate && !selectedEndDate && isSelecting) {
      const newStart = selectedDate < selectedStartDate ? selectedDate : selectedStartDate;
      const newEnd = selectedDate < selectedStartDate ? selectedStartDate : selectedDate;
      setSelectedStartDate(newStart);
      setSelectedEndDate(newEnd);
      setIsSelecting(false);
      
      setTimeout(() => applyCustomDateRange(), 100);
    }
  };

  const clearSelectedDates = (e) => {
    if (e) e.stopPropagation();
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelecting(false);
    setHoverDate(null);
    const { startDate, endDate } = getDateRange('7days');
    setDateRange('7days');
    fetchDashboardData(startDate, endDate);
  };

  // Export funksiyası
  const handleExport = (type) => {
    let data, filename;
    switch(type) {
      case 'sales':
        data = salesData;
        filename = 'satis_melumatlari';
        break;
      case 'products':
        data = topProducts;
        filename = 'en_cox_satilan_mehsullar';
        break;
      case 'customers':
        data = [customerAnalytics];
        filename = 'musteri_analitikasi';
        break;
      default:
        return;
    }
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
  };

  // Təqvim helperləri
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startingDay = firstDay.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
    return { daysInMonth: lastDay.getDate(), startingDay };
  };

  const getMonthName = (date) => {
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    return months[date.getMonth()];
  };

  const isDateInRange = (date) => {
    if (!selectedStartDate) return false;
    const start = selectedStartDate;
    const end = selectedEndDate || hoverDate;
    if (!end) return date.getTime() === start.getTime();
    if (start <= end) return date >= start && date <= end;
    return date >= end && date <= start;
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const weekDays = ['B.E', 'Ç.A', 'Ç', 'C.A', 'C', 'Ş', 'B'];

  if (loading) {
    return (
      <div className="dash">
        <div className="dash-loading">
          <div className="dash-loading__spinner"></div>
          <p>Məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-header__title">Çərəz Mağazası</h1>
          <p className="dash-header__subtitle">
            Son yenilənmə: {new Date().toLocaleString('az-AZ')}
          </p>
        </div>
        <div className="dash-header__actions">
          <button className="dash-btn dash-btn--refresh" onClick={() => {
            if (selectedStartDate && selectedEndDate) {
              fetchDashboardData(selectedStartDate, selectedEndDate);
            } else {
              const { startDate, endDate } = getDateRange(dateRange);
              fetchDashboardData(startDate, endDate);
            }
          }}>
            <FiRefreshCw /> Yenilə
          </button>
          <button className="dash-btn dash-btn--export" onClick={() => handleExport('sales')}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Tarix filtrləri */}
      <div className="dash-date-filter">
        <div className="dash-date-filter__buttons">
          <button 
            className={`dash-date-filter__btn ${dateRange === '7days' && !selectedStartDate ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('7days')}
          >
            Son 7 gün
          </button>
          <button 
            className={`dash-date-filter__btn ${dateRange === '30days' && !selectedStartDate ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('30days')}
          >
            Son 30 gün
          </button>
          <button 
            className={`dash-date-filter__btn ${dateRange === '90days' && !selectedStartDate ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('90days')}
          >
            Son 90 gün
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="dash-row">
        <div className="dash-kpis">
          <div className="dash-kpis__row dash-kpis__row--top">
            <div className="dash-kpi-card">
              <div className="dash-kpi-card__icon dash-kpi-card__icon--revenue">
                <FiDollarSign />
              </div>
              <div className="dash-kpi-card__content">
                <span className="dash-kpi-card__label">Ümumi gəlir</span>
                <span className="dash-kpi-card__value">₼{kpiData.totalRevenue.toLocaleString()}</span>
                <span className={`dash-kpi-card__trend ${kpiData.revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                  {kpiData.revenueGrowth > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                  {Math.abs(kpiData.revenueGrowth)}%
                </span>
              </div>
            </div>

            <div className="dash-kpi-card">
              <div className="dash-kpi-card__icon dash-kpi-card__icon--orders">
                <FiShoppingBag />
              </div>
              <div className="dash-kpi-card__content">
                <span className="dash-kpi-card__label">Ümumi sifariş</span>
                <span className="dash-kpi-card__value">{kpiData.totalOrders.toLocaleString()}</span>
                <span className={`dash-kpi-card__trend ${kpiData.ordersGrowth > 0 ? 'positive' : 'negative'}`}>
                  {kpiData.ordersGrowth > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                  {Math.abs(kpiData.ordersGrowth)}%
                </span>
              </div>
            </div>

            <div className="dash-kpi-card">
              <div className="dash-kpi-card__icon dash-kpi-card__icon--avg-order">
                <FiActivity />
              </div>
              <div className="dash-kpi-card__content">
                <span className="dash-kpi-card__label">Orta sifariş</span>
                <span className="dash-kpi-card__value">₼{kpiData.averageOrderValue}</span>
              </div>
            </div>
          </div>

          <div className="dash-kpis__row dash-kpis__row--bottom">
            <div className="dash-kpi-card">
              <div className="dash-kpi-card__icon dash-kpi-card__icon--pending">
                <FiClock />
              </div>
              <div className="dash-kpi-card__content">
                <span className="dash-kpi-card__label">Gözləyən</span>
                <span className="dash-kpi-card__value">{kpiData.pendingOrders}</span>
                <span className="dash-kpi-card__trend warning">
                  <FiAlertCircle /> Təcili
                </span>
              </div>
            </div>

            <div className="dash-kpi-card">
              <div className="dash-kpi-card__icon" style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                <FiPackage />
              </div>
              <div className="dash-kpi-card__content">
                <span className="dash-kpi-card__label">Satılan məhsul</span>
                <span className="dash-kpi-card__value">
                  {parseFloat(kpiData.totalSoldKg).toLocaleString()} kq
                </span>
                <span className="dash-kpi-card__trend" style={{ fontSize: '12px', color: '#6c757d', background: 'transparent', padding: '0' }}>
                  + {kpiData.totalSoldPiece.toLocaleString()} ədəd
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Təqvim */}
        {!isMobile && (
          <div className="dash-calendar">
            <div className="dash-calendar__container">
              <div className="dash-calendar__header">
                <div className="dash-calendar__month-year">
                  <span className="dash-calendar__month">{getMonthName(currentMonth)}</span>
                  <span className="dash-calendar__year">{currentMonth.getFullYear()}</span>
                </div>
                <div className="dash-calendar__nav">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()))} className="dash-calendar__nav-btn">
                    <FiChevronsLeft />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="dash-calendar__nav-btn">
                    <FiChevronLeft />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="dash-calendar__nav-btn">
                    <FiChevronRight />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()))} className="dash-calendar__nav-btn">
                    <FiChevronsRight />
                  </button>
                </div>
              </div>

              <div className="dash-calendar__weekdays">
                {weekDays.map((day, idx) => <div key={idx} className="dash-calendar__weekday">{day}</div>)}
              </div>

              <div className="dash-calendar__days">
                {Array(startingDay).fill(null).map((_, idx) => (
                  <div key={`empty-${idx}`} className="dash-calendar__day empty"></div>
                ))}
                {Array(daysInMonth).fill(null).map((_, idx) => {
                  const day = idx + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isSelected = isDateInRange(date);
                  const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
                  const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();
                  
                  let dayClass = 'dash-calendar__day';
                  if (isSelected) dayClass += ' selected';
                  if (isStart) dayClass += ' start';
                  if (isEnd) dayClass += ' end';
                  
                  return (
                    <div key={day} className={dayClass} onClick={() => handleDateClick(day)}>
                      {day}
                    </div>
                  );
                })}
              </div>

              {selectedStartDate && selectedEndDate && (
                <div className="dash-calendar__range-info">
                  {formatDisplayDate(selectedStartDate)} - {formatDisplayDate(selectedEndDate)}
                </div>
              )}
              <button className="dash-calendar__clear-btn" onClick={clearSelectedDates}>Təmizlə</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobil təqvim */}
      {isMobile && (
        <div className="dash-mobile-calendar">
          <button className="dash-mobile-calendar__btn" onClick={() => setShowCustomDate(!showCustomDate)}>
            <FiCalendar /> Tarix seç
          </button>
          {showCustomDate && (
            <div className="dash-mobile-calendar__picker">
              <div className="dash-calendar__container">
                <div className="dash-calendar__header">
                  <div className="dash-calendar__month-year">
                    <span className="dash-calendar__month">{getMonthName(currentMonth)}</span>
                    <span className="dash-calendar__year">{currentMonth.getFullYear()}</span>
                  </div>
                  <div className="dash-calendar__nav">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="dash-calendar__nav-btn">
                      <FiChevronLeft />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="dash-calendar__nav-btn">
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
                <div className="dash-calendar__weekdays">
                  {weekDays.map((day, idx) => <div key={idx} className="dash-calendar__weekday">{day}</div>)}
                </div>
                <div className="dash-calendar__days">
                  {Array(startingDay).fill(null).map((_, idx) => (
                    <div key={`empty-${idx}`} className="dash-calendar__day empty"></div>
                  ))}
                  {Array(daysInMonth).fill(null).map((_, idx) => {
                    const day = idx + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const isSelected = isDateInRange(date);
                    
                    let dayClass = 'dash-calendar__day';
                    if (isSelected) dayClass += ' selected';
                    
                    return (
                      <div key={day} className={dayClass} onClick={() => handleDateClick(day)}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <button className="dash-calendar__clear-btn" onClick={clearSelectedDates}>Təmizlə</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Satış Qrafiki */}
      <div className="dash-chart">
        <div className="dash-chart__header">
          <h2 className="dash-chart__title">📊 Satış qrafiki</h2>
          <div className="dash-chart__legend">
            <span className="dash-chart__legend-item">
              <span className="dash-chart__legend-color revenue"></span> Gəlir (₼)
            </span>
            <span className="dash-chart__legend-item">
              <span className="dash-chart__legend-color orders"></span> Sifariş
            </span>
          </div>
        </div>
        <div className="dash-chart__wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="right" dataKey="orders" fill="#3498db" name="Sifariş" barSize={30} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2ecc71" strokeWidth={3} name="Gəlir" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* İkili qrafik sırası */}
      <div className="dash-charts-row">
        <div className="dash-chart dash-chart--half">
          <div className="dash-chart__header">
            <h2 className="dash-chart__title">🛒 Ən çox satılanlar</h2>
            <button className="dash-btn dash-btn--small" onClick={() => handleExport('products')}>
              <FiDownload /> Export
            </button>
          </div>
          <div className="dash-chart__wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'sales') return `${value} ${topProducts[0]?.unit || ''}`;
                  if (name === 'revenue') return `₼${value}`;
                  return value;
                }} />
                <Legend />
                <Bar dataKey="sales" fill="#f39c12" name="Satış miqdarı" />
                <Bar dataKey="revenue" fill="#e67e22" name="Gəlir (₼)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-chart dash-chart--half">
          <div className="dash-chart__header">
            <h2 className="dash-chart__title">👥 Müştəri analitikası</h2>
            <button className="dash-btn dash-btn--small" onClick={() => handleExport('customers')}>
              <FiDownload /> Export
            </button>
          </div>
          <div className="dash-chart__wrapper">
            <div style={{ width: '100%', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{customerAnalytics.active}</div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '8px' }}>Aktiv müştərilər</div>
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>Seçilən dövrdə sifariş edənlər</div>
                </div>
                <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2ecc71' }}>{customerAnalytics.new}</div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '8px' }}>Yeni müştərilər</div>
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>İlk dəfə sifariş edənlər</div>
                </div>
                <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f39c12' }}>{customerAnalytics.repeat}</div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '8px' }}>Təkrar müştərilər</div>
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>Əvvəl də alış-veriş edənlər</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stok analitikası */}
      <div className="dash-stock">
        <h2 className="dash-stock__title">📦 Stok analitikası</h2>
        <div className="dash-stock__grid">
          
          {/* Az qalan məhsullar */}
          <div className="dash-stock__section">
            <h3 className="dash-stock__section-title">⚠️ Az qalan məhsullar</h3>
            <table className="dash-stock__table">
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th>Kateqoriya</th>
                  <th>Stok</th>
                  <th>Limit</th>
                </tr>
              </thead>
              <tbody>
                {stockAnalytics.lowStock && stockAnalytics.lowStock.length > 0 ? (
                  stockAnalytics.lowStock.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td className="warning">{item.stock} {item.unitLabel}</td>
                      <td>{item.threshold} {item.unitLabel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Az qalan məhsul yoxdur</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bitmiş məhsullar */}
          <div className="dash-stock__section">
            <h3 className="dash-stock__section-title">❌ Bitmiş məhsullar</h3>
            <table className="dash-stock__table">
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th>Kateqoriya</th>
                </tr>
              </thead>
              <tbody>
                {stockAnalytics.outOfStock && stockAnalytics.outOfStock.length > 0 ? (
                  stockAnalytics.outOfStock.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center' }}>Bitmiş məhsul yoxdur</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ən çox dövriyyə */}
          <div className="dash-stock__section">
            <h3 className="dash-stock__section-title">🔥 Ən çox dövriyyə</h3>
            <table className="dash-stock__table">
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th>Kateqoriya</th>
                  <th>Dövriyyə</th>
                </tr>
              </thead>
              <tbody>
                {stockAnalytics.highTurnover && stockAnalytics.highTurnover.length > 0 ? (
                  stockAnalytics.highTurnover.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.displayTurnover} {item.unitLabel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>Məlumat yoxdur</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;