import React, { useState, useEffect } from 'react';

const API_URL = "http://localhost:8000";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'vi');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [email, setEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [selectedShortCode, setSelectedShortCode] = useState('');
  const [createdShortUrl, setCreatedShortUrl] = useState('');
  const [activeShortCode, setActiveShortCode] = useState('');
  const [links, setLinks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [filterMode, setFilterMode] = useState('today');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLinkCode, setFilterLinkCode] = useState('all');

  const [longUrl, setLongUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [linkParams, setLinkParams] = useState('');

  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' });

  const MESSAGES = {
    vi: {
      brand: 'Snipio Auth',
      primaryTitle: 'Snipio Workspace',
      usernameOrEmail: 'Tên tài khoản / Email',
      username: 'Tên tài khoản (Username)',
      email: 'Địa chỉ Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      login: '🔓 Đăng nhập',
      register: '✨ Đăng ký',
      registerSubmit: '✨ Hoàn tất đăng ký',
      forgot: 'Quên mật khẩu?',
      forgotTitle: 'Quên mật khẩu',
      forgotSubmit: 'Gửi yêu cầu',
      resetTitle: 'Đặt lại mật khẩu',
      resetSubmit: 'Cập nhật mật khẩu',
      createLink: '+ Tạo link',
      copy: 'Copy',
      close: 'Đóng',
      cancel: 'Hủy',
      logout: 'Thoát',
      noAccount: 'Chưa có tài khoản?',
      haveAccount: 'Đã có tài khoản?',
      backToLogin: 'Quay lại đăng nhập',
      registerSuccess: 'Đăng ký thành công! Hãy đăng nhập lại.',
      linkCopied: 'Đã copy link!',
      forgotSuccess: 'Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi.',
      resetSuccess: 'Mật khẩu đã được cập nhật thành công.',
      tokenMissing: 'Token không hợp lệ hoặc hết hạn. Vui lòng gửi yêu cầu lại.',
      chartHint: 'Chọn 1 link để xem QR',
      tableShort: 'Mã ngắn',
      tableClicks: 'Clicks',
      tableQr: 'QR',
      filterByLabel: 'Lọc',
      dateRangeLabel: 'Khoảng thời gian',
      allLinks: 'Tất cả link',
      today: 'Trong ngày',
      thisMonth: 'Trong tháng',
      thisYear: 'Trong năm',
      customRange: 'Tùy chọn ngày',
      fromLabel: 'Từ ngày',
      toLabel: 'Đến ngày',
      linkSelectionLabel: 'Chọn link',
      wrongCredentials: 'Sai tài khoản hoặc mật khẩu.',
      dashboardTitle: 'Bảng điều khiển',
      clicksSelectedLink: 'Clicks Link Chọn',
      totalLinks: 'Tổng Links',
      systemTitle: 'Hệ thống dữ liệu SQLite',
      createSuccess: 'Khởi tạo thành công!',
      qrTitle: 'Mã QR Code',
      passwordMismatch: 'Mật khẩu nhập lại không trùng khớp.',
      resetInstruction: 'Vui lòng nhập mật khẩu mới để cập nhật.',
      emailPlaceholder: 'email@gmail.com',
      customAliasPlaceholder: 'Bí danh tùy chỉnh (không bắt buộc)...',
      domainPlaceholder: 'Domain tùy chỉnh (không bắt buộc)...',
      paramsPlaceholder: 'Tham số truy vấn (không bắt buộc)...',
      linkNameLabel: 'Tên link (không bắt buộc)',
      aliasLabel: 'Alias tùy chỉnh',
      domainLabel: 'Domain tùy chỉnh',
      paramsLabel: 'Tham số URL',
      analyticsTitle: 'Thống kê link',
      linkDetails: 'Dữ liệu click',
      exportData: 'Tải CSV',
      backToDashboard: 'Quay lại Dashboard',
      viewLink: 'Xem thống kê',
      downloadError: 'Không thể tải dữ liệu.',
      currentLanguage: 'EN',
      switchLanguage: 'Chuyển ngôn ngữ'
    },
    en: {
      brand: 'Snipio Auth',
      primaryTitle: 'Snipio Workspace',
      usernameOrEmail: 'Username / Email',
      username: 'Username',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password',
      login: '🔓 Sign in',
      register: '✨ Register',
      registerSubmit: '✨ Complete registration',
      forgot: 'Forgot password?',
      forgotTitle: 'Forgot password',
      forgotSubmit: 'Send request',
      resetTitle: 'Reset password',
      resetSubmit: 'Update password',
      createLink: '+ Create link',
      copy: 'Copy',
      close: 'Close',
      cancel: 'Cancel',
      logout: 'Logout',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      backToLogin: 'Back to login',
      registerSuccess: 'Registration successful! Please log in.',
      linkCopied: 'Link copied!',
      forgotSuccess: 'If your account exists, a reset email has been sent.',
      resetSuccess: 'Password updated successfully.',
      tokenMissing: 'Invalid or expired token. Please request a new reset.',
      chartHint: 'Select a link to show QR',
      tableShort: 'Shortcode',
      tableClicks: 'Clicks',
      tableQr: 'QR',
      filterByLabel: 'Filter',
      dateRangeLabel: 'Date range',
      allLinks: 'All links',
      today: 'Today',
      thisMonth: 'This month',
      thisYear: 'This year',
      customRange: 'Custom range',
      fromLabel: 'From',
      toLabel: 'To',
      linkSelectionLabel: 'Choose link',
      wrongCredentials: 'Wrong username or password.',
      dashboardTitle: 'Dashboard',
      clicksSelectedLink: 'Selected link clicks',
      totalLinks: 'Total links',
      systemTitle: 'SQLite Data System',
      createSuccess: 'Created successfully!',
      qrTitle: 'QR Code',
      passwordMismatch: 'Password confirmation does not match.',
      resetInstruction: 'Enter a new password to update it.',
      emailPlaceholder: 'email@gmail.com',
      customAliasPlaceholder: 'Custom alias (optional)...',
      domainPlaceholder: 'Custom domain (optional)...',
      paramsPlaceholder: 'Query params (optional)...',
      linkNameLabel: 'Link name (optional)',
      aliasLabel: 'Custom alias',
      domainLabel: 'Custom domain',
      paramsLabel: 'URL params',
      analyticsTitle: 'Link Analytics',
      linkDetails: 'Click Data',
      exportData: 'Download CSV',
      backToDashboard: 'Back to dashboard',
      viewLink: 'View analytics',
      downloadError: 'Unable to download data.',
      currentLanguage: 'EN',
      switchLanguage: 'Switch language'
    }
  };

  const t = MESSAGES[lang] || MESSAGES.vi;

  const showNotification = (type, title, message) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const updateLanguage = (value) => {
    setLang(value);
    localStorage.setItem('lang', value);
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    updateLanguage(nextLang);
  };

  const downloadClickCsv = async (shortCode) => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/${shortCode}/export`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clicks_${shortCode}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showNotification('error', `❌ ${t.toastError}`, 'Không thể tải dữ liệu.');
    }
  };

  const openLinkDetails = (shortCode) => {
    setActiveShortCode(shortCode);
    setCurrentScreen('linkDetails');
    fetchLinkAnalytics(shortCode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', username.trim());
      params.append('password', password);

      const response = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: params.toString()
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username.trim());
        showNotification('success', `✅ ${t.toastSuccess}`, t.login);
        setCurrentScreen('dashboard');
        fetchAllLinks();
      } else {
        showNotification('error', `❌ ${t.toastError}`, data.detail || t.wrongCredentials);
      }
    } catch (err) {
      showNotification('error', `💥 ${t.toastError}`, t.connectBackend);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showNotification('warning', '⚠️ Cảnh báo', t.passwordMismatch);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✨ ${t.toastSuccess}`, t.registerSuccess);
        setCurrentScreen('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        showNotification('error', `❌ ${t.toastError}`, data.detail || t.registerFailed);
      }
    } catch (err) {
      showNotification('error', `💥 ${t.toastError}`, t.connectBackend);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✉️ ${t.toastSuccess}`, data.message || t.forgotSuccess);
        setForgotEmail('');
        setCurrentScreen('login');
      } else {
        showNotification('error', `❌ ${t.toastError}`, data.detail || t.forgotFailed);
      }
    } catch (err) {
      showNotification('error', `💥 ${t.toastError}`, t.connectBackend);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      showNotification('warning', '⚠️ Cảnh báo', t.tokenMissing);
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      showNotification('warning', '⚠️ Cảnh báo', t.passwordMismatch);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: resetPassword })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✅ ${t.toastSuccess}`, data.message || t.resetSuccess);
        setResetPassword('');
        setResetConfirmPassword('');
        setResetToken('');
        window.history.replaceState({}, document.title, window.location.pathname);
        setCurrentScreen('login');
      } else {
        showNotification('error', `❌ ${t.toastError}`, data.detail || t.resetFailed);
      }
    } catch (err) {
      showNotification('error', `💥 ${t.toastError}`, t.connectBackend);
    }
  };

  const buildAnalyticsQuery = () => {
    const params = new URLSearchParams();
    if (filterMode) params.append('period', filterMode);
    if (filterMode === 'custom') {
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchAllLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/all-links`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
        if (data.length > 0) {
          const targetCode = filterLinkCode === 'all' ? 'all' : filterLinkCode || data[0].short_code;
          fetchLinkAnalytics(targetCode);
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchLinkAnalytics = async (shortCode = filterLinkCode || 'all') => {
    try {
      const queryString = buildAnalyticsQuery();
      const targetCode = shortCode || (filterLinkCode === 'all' ? 'all' : 'all');
      const response = await fetch(`${API_URL}/api/analytics/${targetCode}${queryString}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    if (token) {
      if (savedUser) setUsername(savedUser);
      setCurrentScreen('dashboard');
      fetchAllLinks();
    }

    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setResetToken(tokenParam);
      setCurrentScreen('reset');
    }

    fetch(`${API_URL}/api/system/alerts`)
      .then(res => res.json()).then(d => { if (d.status === 'success') setSystemAlerts(d.alerts); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (currentScreen !== 'dashboard') return;
    if (links.length === 0) return;
    const targetCode = filterLinkCode === 'all' ? 'all' : filterLinkCode;
    fetchLinkAnalytics(targetCode);
  }, [filterMode, filterStartDate, filterEndDate, filterLinkCode, currentScreen, links.length]);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: longUrl,
          name: linkName || null,
          alias: customAlias || null,
          domain: customDomain || null,
          params: linkParams || null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setCreatedShortUrl(data.short_url || `${API_URL}/${data.short_code}`);
        setSelectedShortCode(data.short_code);
        setIsSuccessOpen(true);
        setIsCreateOpen(false);
        setLongUrl(''); setLinkName(''); setCustomAlias(''); setCustomDomain(''); setLinkParams('');
        fetchAllLinks();
        fetchLinkAnalytics(data.short_code);
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) { showNotification('error', '💥 Lỗi', 'Hỏng kết nối.'); }
  };

  const renderChartSVG = () => {
    const defaultData = [15, 25, 18, 42, 30, 65, 45, 78, 52, 95, 80, 110];
    let data = defaultData;
    if (analyticsData?.charts?.devices) {
      const vals = Object.values(analyticsData.charts.devices);
      if (vals.length > 0) data = [vals[0], vals[0] * 2, Math.round(vals[0] / 2), vals[0] + 4, vals[0] * 2, vals[0], vals[0] + 5, vals[0] * 3].slice(0, 12);
    }
    const W = 520, H = 180, pad = { t: 20, r: 20, b: 25, l: 35 };
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const maxV = Math.max(...data, 10), n = data.length;
    const points = data.map((v, i) => [pad.l + (i / (n - 1)) * iW, pad.t + iH * (1 - v / maxV)]);
    
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1][0] + points[i][0]) / 2;
      d += ` C ${cx} ${points[i - 1][1]}, ${cx} ${points[i][1]}, ${points[i][0]} ${points[i][1]}`;
    }

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.25" /><stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.01" /></linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#a29bfe" /><stop offset="100%" stopColor="#fd79a8" /></linearGradient>
        </defs>
        {/* Đã đồng bộ sửa .forEach thành .map để hiển thị các vạch lưới đồ thị */}
        {[0, 0.5, 1].map((f, idx) => {
          const y = pad.t + iH * (1 - f);
          return (
            <g key={idx}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(122,122,154,0.5)">{Math.round(maxV * f)}</text>
            </g>
          );
        })}
        <path d={`${d} L ${points[points.length - 1][0]} ${H - pad.b} L ${points[0][0]} ${H - pad.b} Z`} fill="url(#areaGrad)" />
        <path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3.5" fill="#fd79a8" stroke="#111118" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div className="flex min-h-screen text-[#e8e8f0] bg-[#0a0a0f]">
      {toast.show && (
        <div className="fixed top-5 right-5 z-[9999] p-4 rounded-xl border flex items-start gap-3 w-[340px] shadow-2xl backdrop-blur-md"
          style={{ backgroundColor: toast.type === 'success' ? 'rgba(85,239,196,0.1)' : 'rgba(255,118,117,0.1)', borderColor: toast.type === 'success' ? '#55efc4' : '#ff7675' }}>
          <div className="text-xs font-bold uppercase">{toast.title}</div>
          <div className="text-[11px] mt-1">{toast.message}</div>
        </div>
      )}
      
      {currentScreen === 'login' && (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-2xl w-[400px] p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6c5ce7] to-[#fd79a8]"></div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0]">{t.brand}</div>
              <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="vi">VN</option>
                <option value="en">EN</option>
              </select>
            </div>
            <div className="text-center mb-6"><div className="text-2xl font-extrabold text-[#e8e8f0]">{t.primaryTitle}</div></div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.usernameOrEmail}</label>
                <input required type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none font-mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernameOrEmail} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.password}</label>
                <div className="relative flex items-center">
                  <input required type={showLoginPassword ? 'text' : 'password'} className="w-full bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 pr-10 text-xs text-white outline-none font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 text-xs" onClick={() => setShowLoginPassword(!showLoginPassword)}>{showLoginPassword ? '👁️' : '🙈'}</button>
                </div>
              </div>
              <button type="submit" className="bg-[#6c5ce7] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md">{t.login}</button>
            </form>
            <div className="flex justify-between items-center text-xs text-[#7a7a9a] mt-5">
              <span>{t.noAccount} <span className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => setCurrentScreen('register')}>{t.register}</span></span>
              <button className="text-[#60a5fa] hover:underline" onClick={() => setCurrentScreen('forgot')}>{t.forgot}</button>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'register' && (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-2xl w-[400px] p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00cec9] to-[#6c5ce7]"></div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0]">{t.register}</div>
              <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="vi">VN</option>
                <option value="en">EN</option>
              </select>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.username}</label>
                <input required type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none font-mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.username} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.email}</label>
                <input required type="email" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none font-mono" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.password}</label>
                <div className="relative flex items-center">
                  <input required type={showRegPassword ? 'text' : 'password'} className="w-full bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 pr-10 text-xs text-white outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 text-xs" onClick={() => setShowRegPassword(!showRegPassword)}>{showRegPassword ? '👁️' : '🙈'}</button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.confirmPassword}</label>
                <div className="relative flex items-center">
                  <input required type={showRegConfirmPassword ? 'text' : 'password'} className="w-full bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 pr-10 text-xs text-white outline-none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 text-xs" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}>{showRegConfirmPassword ? '👁️' : '🙈'}</button>
                </div>
              </div>
              <button type="submit" className="bg-[#00cec9] text-[#0a0a0f] text-xs font-bold py-2.5 rounded-xl cursor-pointer">{t.registerSubmit}</button>
            </form>
            <div className="text-center text-xs text-[#7a7a9a] mt-5">{t.haveAccount} <span className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => setCurrentScreen('login')}>{t.login}</span></div>
          </div>
        </div>
      )}

      {currentScreen === 'forgot' && (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-2xl w-[400px] p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#fdcb6e] to-[#6c5ce7]"></div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0]">{t.forgotTitle}</div>
              <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="vi">VN</option>
                <option value="en">EN</option>
              </select>
            </div>
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.email}</label>
                <input required type="email" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder={t.emailPlaceholder} />
              </div>
              <button type="submit" className="bg-[#fdcb6e] text-[#0a0a0f] text-xs font-bold py-2.5 rounded-xl cursor-pointer">{t.forgotSubmit}</button>
            </form>
            <div className="text-center text-xs text-[#7a7a9a] mt-5"><button className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => setCurrentScreen('login')}>{t.backToLogin}</button></div>
          </div>
        </div>
      )}

      {currentScreen === 'reset' && (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-2xl w-[400px] p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4ade80] to-[#60a5fa]"></div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0]">{t.resetTitle}</div>
              <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="vi">VN</option>
                <option value="en">EN</option>
              </select>
            </div>
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
              <div className="rounded-xl bg-[#14141c] border border-[rgba(255,255,255,0.06)] p-4 text-[11px] text-[#7a7a9a]">
                {resetToken ? t.resetInstruction : t.tokenMissing}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.password}</label>
                <input required type={showRegPassword ? 'text' : 'password'} className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.confirmPassword}</label>
                <input required type={showRegConfirmPassword ? 'text' : 'password'} className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="bg-[#4ade80] text-[#0a0a0f] text-xs font-bold py-2.5 rounded-xl cursor-pointer">{t.resetSubmit}</button>
            </form>
            <div className="text-center text-xs text-[#7a7a9a] mt-5"><button className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => setCurrentScreen('login')}>{t.backToLogin}</button></div>
          </div>
        </div>
      )}

      {currentScreen === 'dashboard' && (
        <div className="flex w-full min-h-screen text-[#e8e8f0]">
          <aside className="w-[220px] bg-[#111118] border-r border-[rgba(255,255,255,0.07)] flex flex-col py-6 fixed top-0 left-0 bottom-0">
            <div className="px-5 pb-7 flex items-center gap-2.5">
              <div className="text-xl font-extrabold text-[#e8e8f0]">Snip<span className="text-[#a29bfe]">io</span></div>
            </div>
            <div className="px-3 mb-1 flex-1">
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[rgba(108,92,231,0.15)] text-[#a29bfe] text-xs cursor-pointer">📊 Dashboard</div>
            </div>
            <div className="px-5 pt-4 border-t border-[rgba(255,255,255,0.07)] flex justify-between items-center">
              <div className="text-[11px] font-semibold truncate max-w-[80px]">{username}</div>
              <button className="text-[10px] text-[#ff7675] cursor-pointer" onClick={() => { localStorage.clear(); setCurrentScreen('login'); }}>{t.logout}</button>
            </div>
          </aside>

          <div className="ml-[220px] flex-1 flex flex-col">
            <div className="bg-[#111118] border-b border-[rgba(255,255,255,0.07)] px-7 py-3.5 flex items-center justify-between sticky top-0">
              <div className="text-sm font-bold">{t.dashboardTitle || 'Dashboard'}</div>
              <div className="flex items-center gap-2">
                <button className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer" onClick={() => setIsCreateOpen(true)}>{t.createLink}</button>
                <button className={`px-3 py-2 rounded-lg text-xs font-semibold ${lang === 'vi' ? 'bg-[#4ade80] text-[#0a0a0f]' : 'bg-[#18181f] text-[#a29bfe]'}`} onClick={() => updateLanguage('vi')}>VI</button>
                <button className={`px-3 py-2 rounded-lg text-xs font-semibold ${lang === 'en' ? 'bg-[#4ade80] text-[#0a0a0f]' : 'bg-[#18181f] text-[#a29bfe]'}`} onClick={() => updateLanguage('en')}>EN</button>
              </div>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                  <div className="text-[11px] text-[#7a7a9a] uppercase">{t.clicksSelectedLink || 'Selected link clicks'}</div>
                  <div className="text-3xl font-extrabold text-[#a29bfe]">{analyticsData?.summary?.total_clicks || 0}</div>
                </div>
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                  <div className="text-[11px] text-[#7a7a9a] uppercase">{t.totalLinks || 'Total links'}</div>
                  <div className="text-3xl font-extrabold text-[#00cec9]">{links.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="col-span-2 bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                  <div className="h-[150px] w-full">{renderChartSVG()}</div>
                </div>
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 flex flex-col items-center justify-center">
                  {analyticsData?.link_info?.short_code ? (
                    <>
                      <div className="bg-white p-1.5 rounded-lg"><img src={`${API_URL}/api/qrcode/${analyticsData.link_info.short_code}`} alt="QR" className="w-20 h-20" /></div>
                    </>
                  ) : <div className="text-xs italic text-[#7a7a9a]">{t.chartHint}</div>}
                </div>
              </div>

              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden">
                <div className="p-4 bg-[#14141c] font-bold text-sm">{t.systemTitle || 'SQLite Data System'}</div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#18181f] text-[11px] text-[#4a4a6a] border-b border-[rgba(255,255,255,0.07)]">
                      <th className="p-4">{t.tableShort}</th>
                      <th className="p-4">{t.tableClicks}</th>
                      <th className="p-4 text-center">{t.tableQr}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link, idx) => (
                      <tr key={idx} className="border-b border-[rgba(255,255,255,0.04)] cursor-pointer" onClick={() => openLinkDetails(link.short_code)}>
                        <td className="p-4 text-xs font-mono text-[#a29bfe]">/{link.short_code}</td>
                        <td className="p-4 text-xs font-mono">{link.clicks}</td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}><button className="bg-[#18181f] px-2 py-1 border border-[rgba(255,255,255,0.1)] text-xs rounded cursor-pointer" onClick={() => { setSelectedShortCode(link.short_code); setIsQrOpen(true); }}>◼</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'linkDetails' && (
        <div className="w-full min-h-screen bg-[#0a0a0f] p-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="text-sm text-[#7a7a9a] uppercase">{t.analyticsTitle}</div>
                <div className="text-2xl font-bold text-[#e8e8f0]">/{activeShortCode}</div>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#6c5ce7] px-4 py-2 rounded-lg text-white text-xs" onClick={() => downloadClickCsv(activeShortCode)}>{t.exportData}</button>
                <button className="bg-[#18181f] border border-[rgba(255,255,255,0.08)] px-4 py-2 rounded-lg text-xs text-[#a29bfe]" onClick={() => { setCurrentScreen('dashboard'); }}>{t.backToDashboard}</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                <div className="text-[11px] text-[#7a7a9a] uppercase">{t.tableClicks}</div>
                <div className="text-3xl font-extrabold text-[#a29bfe]">{analyticsData?.summary?.total_clicks || 0}</div>
              </div>
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 col-span-2">
                <div className="text-[11px] text-[#7a7a9a] uppercase mb-2">{t.domainLabel}</div>
                <div className="text-xs text-[#e8e8f0] break-words">{analyticsData?.link_info?.original_url || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {analyticsData?.charts && Object.entries(analyticsData.charts).map(([label, values]) => (
                <div key={label} className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                  <div className="text-[11px] text-[#7a7a9a] uppercase mb-3">{label}</div>
                  <div className="space-y-2">
                    {Object.entries(values).map(([key, count]) => (
                      <div key={key} className="text-xs flex justify-between">
                        <span>{key}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden">
              <div className="p-4 bg-[#14141c] font-bold text-sm">{t.linkDetails || 'Click Data'}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#18181f] text-[11px] text-[#4a4a6a] border-b border-[rgba(255,255,255,0.07)]">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">OS</th>
                      <th className="p-3">Browser</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Referer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.click_rows?.map((row, idx) => (
                      <tr key={idx} className="border-b border-[rgba(255,255,255,0.04)]">
                        <td className="p-3 text-xs">{row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}</td>
                        <td className="p-3 text-xs">{row.ip_address || '-'}</td>
                        <td className="p-3 text-xs">{row.device_type || '-'}</td>
                        <td className="p-3 text-xs">{row.os || '-'}</td>
                        <td className="p-3 text-xs">{row.browser || '-'}</td>
                        <td className="p-3 text-xs">{row.traffic_source || '-'}</td>
                        <td className="p-3 text-xs">{row.referer || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO LINK MỚI */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[520px] p-6">
            <h3 className="text-base font-bold mb-4">⚡ {t.createLink}</h3>
            <form onSubmit={handleCreateLink} className="flex flex-col gap-4">
              <input required type="url" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder={t.longUrlPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder={t.linkNameLabel} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} placeholder={t.customAliasPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder={t.domainPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkParams} onChange={(e) => setLinkParams(e.target.value)} placeholder={t.paramsPlaceholder} />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCreateOpen(false)}>{t.cancel}</button><button type="submit" className="bg-[#6c5ce7] px-4 py-1.5 rounded-lg text-white text-xs">{t.createLink}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÀNH CÔNG */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[#55efc4] rounded-2xl w-[400px] p-6 flex flex-col items-center gap-4">
            <div className="text-sm font-bold text-[#55efc4]">✓ {t.createSuccess || 'Created successfully!'}</div>
            <div className="bg-white p-2 rounded-lg"><img src={`${API_URL}/api/qrcode/${selectedShortCode}`} alt="QR" className="w-[120px] h-[120px]" /></div>
            <div className="w-full flex items-center bg-[#18181f] p-1.5 rounded-lg border border-[rgba(255,255,255,0.1)]">
              <input readOnly type="text" className="bg-transparent text-xs text-[#a29bfe] font-mono flex-1 px-2 outline-none" value={createdShortUrl} />
              <button className="bg-[#6c5ce7] px-3 py-1 rounded text-xs text-white font-semibold cursor-pointer" onClick={() => { navigator.clipboard.writeText(createdShortUrl); showNotification('success', '📋 Thành Công', t.linkCopied); }}>{t.copy}</button>
            </div>
            <button className="w-full bg-[#18181f] text-xs py-2 rounded-lg text-[#7a7a9a]" onClick={() => { setIsSuccessOpen(false); setCreatedShortUrl(''); }}>{t.close}</button>
          </div>
        </div>
      )}

      {/* MODAL XEM QR ĐỘC LẬP */}
      {isQrOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[340px] p-6 flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center"><span className="text-xs font-bold">{t.qrTitle}</span><button onClick={() => setIsQrOpen(false)}>✕</button></div>
            <div className="bg-white p-3 rounded-xl"><img src={`${API_URL}/api/qrcode/${selectedShortCode}`} alt="QR" className="w-[150px] h-[150px]" /></div>
            <div className="text-xs font-mono bg-[#18181f] py-1 px-3 border border-[rgba(255,255,255,0.05)] rounded">localhost:8000/{selectedShortCode}</div>
          </div>
        </div>
      )}

    </div>
  );
}