import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./components/AdminLogin1/AdminLogin";
import AdminPanel from "./pages/AdminPanel/AdminPanel";
import AllOrders from "./pages/AdminPanel/components/AllOrders";
import ProductList from "./pages/AdminPanel/components/ProductList";
import ProductUpload from "./pages/AdminPanel/components/ProductUpload";
import ProfileContent from "./pages/AdminPanel/components/ProfileContent";
import Dashboard from "./pages/AdminPanel/components/Dashboard";
import MessageSection from "./pages/AdminPanel/components/MessageSection/MessageSection";
import NotificationCenter from "./pages/AdminPanel/components/NotificationCenter.jsx";
import Campaigns from "./pages/AdminPanel/components/Campaigns";
import Blog from "./pages/AdminPanel/components/Blog";
import Categories from "./pages/AdminPanel/components/Categories";  // ✅ ƏLAVƏ ET
import { ProductProvider } from "./contexts/ProductContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import "./App.css";

// BOŞ SƏHİFƏLƏR ÜÇÜN SADƏ KOMPONENTLƏR
const AuthenticationPlaceholder = () => <div>Authentication səhifəsi hazırlanır</div>;
const UsersPlaceholder = () => <div>Users səhifəsi hazırlanır</div>;
const InvoicesPlaceholder = () => <div>Invoices səhifəsi hazırlanır</div>;
const SettingsPlaceholder = () => <div>Settings səhifəsi hazırlanır</div>;
const BlankPagePlaceholder = () => <div>Blank Page səhifəsi hazırlanır</div>;

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem("adminToken") !== null;
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <ProductProvider>
      <CategoryProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated() ? 
                <Navigate to="/admin/dashboard" replace /> : 
                <AdminLogin />
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<AllOrders />} />
              <Route path="products/list" element={<ProductList />} />
              <Route path="products/upload" element={<ProductUpload />} />
              <Route path="profile" element={<ProfileContent />} />
              <Route path="messages" element={<MessageSection />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="blog" element={<Blog />} />
              <Route path="categories" element={<Categories />} />  {/* ✅ ƏLAVƏ ET */}
              <Route path="authentication" element={<AuthenticationPlaceholder />} />
              <Route path="users" element={<UsersPlaceholder />} />
              <Route path="invoices" element={<InvoicesPlaceholder />} />
              <Route path="settings" element={<SettingsPlaceholder />} />
              <Route path="blank" element={<BlankPagePlaceholder />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </CategoryProvider>
    </ProductProvider>
  );
}

export default App;