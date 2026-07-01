import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";  // ✅ API istifadə edirik
import "./AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Səhifə yüklənəndə inputları təmizlə və localStorage-ı yoxla
  useEffect(() => {
    setEmail("");
    setPassword("");
    // Əgər artıq login olunubsa, dashboard-a yönləndir
    if (localStorage.getItem("adminToken")) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ DÜZGÜN - api istifadə edirik
      const response = await api.post("/admin/login", {
        email,
        password,
      });

      // api interceptor-u avtomatik olaraq response.data qaytarır
      const data = response.data;

      if (data.success !== false) {
        // Tokeni localStorage-da saxla
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", data.admin?.email || email);
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Email və ya şifrə yanlışdır!");
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    } catch (error) {
      console.error("Login xətası:", error);
      
      // Xəta mesajını göstər
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.request) {
        setError("Serverə qoşulma xətası! Backend işlədiyindən əmin olun.");
      } else {
        setError("Bir xəta baş verdi. Yenidən cəhd edin.");
      }
      
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Admin Panel</h1>
        <p className="login-subtitle">Daxil olmaq üçün məlumatlarınızı daxil edin</p>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-poçt ünvanınızı daxil edin"
              className="input-field"
              required
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrənizi daxil edin"
              className="input-field"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Giriş edilir..." : "Daxil ol"}
          </button>
        </form>

        {/* Test məlumatı */}
        <div className="login-hint">
          <p>Test: admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;