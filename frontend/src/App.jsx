import React, { useState, useEffect } from 'react';

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "https://fast.toolhub.app/slink";

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
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShortCode, setEditingShortCode] = useState('');
  const [editExpiredAt, setEditExpiredAt] = useState('');
  const [editLinkStatus, setEditLinkStatus] = useState('');
  const [editLinkName, setEditLinkName] = useState('');

  // const [isOAuthSimOpen, setIsOAuthSimOpen] = useState(false);
  // const [oauthProvider, setOauthProvider] = useState('');
  // const [customOAuthEmail, setCustomOAuthEmail] = useState('');

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

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState('personal');
  const [isWorkspaceCreateOpen, setIsWorkspaceCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [selectedWorkspaceForLink, setSelectedWorkspaceForLink] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('');
  const [isWorkspaceLinksOpen, setIsWorkspaceLinksOpen] = useState(false);
  const [workspaceLinks, setWorkspaceLinks] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLinks, setAdminLinks] = useState([]);
  const [adminWorkspaces, setAdminWorkspaces] = useState([]);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'member');
  const [adminTab, setAdminTab] = useState('users');

  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [isAdminLinkModalOpen, setIsAdminLinkModalOpen] = useState(false);
  const [isAdminWorkspaceModalOpen, setIsAdminWorkspaceModalOpen] = useState(false);
  const [adminEditingUser, setAdminEditingUser] = useState(null);
  const [adminEditingLink, setAdminEditingLink] = useState(null);
  const [adminEditingWorkspace, setAdminEditingWorkspace] = useState(null);

  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserUsername, setAdminUserUsername] = useState('');
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [adminUserRole, setAdminUserRole] = useState('member');

  const [adminLinkUrl, setAdminLinkUrl] = useState('');
  const [adminLinkAlias, setAdminLinkAlias] = useState('');
  const [adminLinkName, setAdminLinkName] = useState('');
  const [adminLinkOwnerEmail, setAdminLinkOwnerEmail] = useState('');
  const [adminLinkExpiredAt, setAdminLinkExpiredAt] = useState('');
  const [adminLinkStatus, setAdminLinkStatus] = useState('active');

  const [adminWorkspaceName, setAdminWorkspaceName] = useState('');
  const [adminWorkspaceOwnerEmail, setAdminWorkspaceOwnerEmail] = useState('');

  const [longUrl, setLongUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [linkParams, setLinkParams] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' });

  const MESSAGES = {
    vi: {
      brand: 'SLinkTrack',
      primaryTitle: 'Shortlink giúp bạn theo dõi và phân tích dữ liệu người dùng',
      usernameOrEmail: 'Địa chỉ Email',
      username: 'Tên tài khoản',
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
      createLink: '+ Tạo liên kết',
      copy: 'Copy',
      close: 'Đóng',
      cancel: 'Hủy',
      logout: 'Thoát',
      noAccount: 'Chưa có tài khoản?',
      haveAccount: 'Đã có tài khoản?',
      backToLogin: 'Quay lại đăng nhập',
      registerSuccess: 'Đăng ký thành công! Hãy đăng nhập lại.',
      linkCopied: 'Đã copy liên kết!',
      forgotSuccess: 'Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi.',
      resetSuccess: 'Mật khẩu đã được cập nhật thành công.',
      tokenMissing: 'Token không hợp lệ hoặc hết hạn. Vui lòng gửi yêu cầu lại.',
      chartHint: 'Chọn một liên kết để xem mã QR',
      tableShort: 'Mã ngắn',
      tableClicks: 'Lượt click',
      tableQr: 'Mã QR',
      filterByLabel: 'Lọc',
      dateRangeLabel: 'Khoảng thời gian',
      allLinks: 'Tất cả liên kết',
      today: 'Trong ngày',
      thisMonth: 'Trong tháng',
      thisYear: 'Trong năm',
      customRange: 'Tùy chọn ngày',
      fromLabel: 'Từ ngày',
      toLabel: 'Đến ngày',
      linkSelectionLabel: 'Chọn liên kết',
      wrongCredentials: 'Sai tài khoản hoặc mật khẩu.',
      dashboardTitle: 'Trang chủ',
      clicksSelectedLink: 'Số click liên kết đã chọn',
      totalLinks: 'Tổng số liên kết',
      systemTitle: 'Danh sách liên kết rút gọn',
      createSuccess: 'Khởi tạo thành công!',
      qrTitle: 'Mã QR',
      passwordMismatch: 'Mật khẩu nhập lại không trùng khớp.',
      resetInstruction: 'Vui lòng nhập mật khẩu mới để cập nhật.',
      emailPlaceholder: 'email@gmail.com',
      customAliasPlaceholder: 'Bí danh tùy chỉnh (không bắt buộc)...',
      domainPlaceholder: 'Tên miền tùy chỉnh (không bắt buộc)...',
      paramsPlaceholder: 'Tham số truy vấn (không bắt buộc)...',
      linkNameLabel: 'Tên liên kết (không bắt buộc)',
      aliasLabel: 'Bí danh tùy chỉnh',
      domainLabel: 'Tên miền tùy chỉnh',
      paramsLabel: 'Tham số liên kết',
      analyticsTitle: 'Thống kê liên kết',
      linkDetails: 'Dữ liệu click',
      exportData: 'Tải CSV',
      backToDashboard: 'Quay lại Trang chủ',
      viewLink: 'Xem thống kê',
      downloadError: 'Không thể tải dữ liệu.',
      currentLanguage: 'EN',
      switchLanguage: 'Chuyển ngôn ngữ',
      workspaces: 'Nhóm',
      createWorkspace: 'Tạo Nhóm mới',
      workspaceName: 'Tên Nhóm',
      inviteMember: 'Mời thành viên',
      memberEmail: 'Email người cần mời',
      viewMembers: 'Xem thành viên',
      membersList: 'Danh sách thành viên',
      viewLinks: 'Xem liên kết',
      workspaceLinksTitle: 'Danh sách liên kết trong nhóm',
      noWorkspaceLinks: 'Chưa có liên kết nào trong nhóm này.'
    },
    en: {
      brand: 'SLinkTrack',
      primaryTitle: 'Shortlink helps you track and analyze user data',
      usernameOrEmail: 'Email Address',
      username: 'Username',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
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
      systemTitle: 'Shortened links list',
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
      backToDashboard: 'Back to Dashboard',
      viewLink: 'View analytics',
      downloadError: 'Unable to download data.',
      currentLanguage: 'EN',
      switchLanguage: 'Switch language',
      workspaces: 'Workspaces',
      createWorkspace: 'Create Workspace',
      workspaceName: 'Workspace Name',
      inviteMember: 'Invite Member',
      memberEmail: 'Member Email',
      viewMembers: 'View members',
      membersList: 'Members list',
      viewLinks: 'View links',
      workspaceLinksTitle: 'Workspace Links List',
      noWorkspaceLinks: 'No links created in this workspace yet.'
    }
  };

  const t = MESSAGES[lang] || MESSAGES.vi;

  const showNotification = (type, title, message) => {
    let formattedMessage = message;
    if (message && typeof message === 'object') {
      if (Array.isArray(message)) {
        formattedMessage = message.map(err => {
          const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
          return `${field}: ${err.msg}`;
        }).join('; ');
      } else {
        formattedMessage = message.detail || JSON.stringify(message);
      }
    }
    setToast({ show: true, type, title, message: formattedMessage });
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
        localStorage.setItem('role', data.role || 'member');
        setUserRole(data.role || 'member');
        showNotification('success', `✅ ${t.toastSuccess}`, data.message || 'Đăng nhập thành công!');
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
        showNotification('success', `✨ ${t.toastSuccess}`, data.message || t.registerSuccess);
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setCurrentScreen('login');
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
      const emailVal = forgotEmail.trim();
      const response = await fetch(`${API_URL}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✉️ ${t.toastSuccess}`, data.message || t.forgotSuccess);
        setForgotEmail('');
        setResetEmail(emailVal);
        setCountdown(60);
        setIsOtpVerified(false);
        if (data.otp) {
          setOtp(data.otp);
        }
        setCurrentScreen('reset');
      } else {
        showNotification('error', `❌ Lỗi`, data.detail || 'Có lỗi xảy ra');
      }
    } catch (err) {
      showNotification('error', `💥 Lỗi`, t.connectBackend);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✉️ ${t.toastSuccess}`, data.message || t.forgotSuccess);
        setCountdown(60);
        if (data.otp) {
          setOtp(data.otp);
        }
      } else {
        showNotification('error', `❌ Lỗi`, data.detail || 'Có lỗi xảy ra');
      }
    } catch (err) {
      showNotification('error', `💥 Lỗi`, t.connectBackend);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showNotification('warning', '⚠️ Cảnh báo', 'Thiếu thông tin email');
      return;
    }
    if (!otp) {
      showNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập mã OTP');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail, 
          otp: otp.trim() 
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✅ Thành công', data.message || 'Mã OTP chính xác!');
        setIsOtpVerified(true);
      } else {
        showNotification('error', '❌ Lỗi', data.detail || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } catch (err) {
      showNotification('error', '💥 Lỗi', t.connectBackend);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showNotification('warning', '⚠️ Cảnh báo', 'Thiếu thông tin email');
      return;
    }
    if (!otp) {
      showNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập mã OTP');
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
        body: JSON.stringify({ 
          email: resetEmail, 
          otp: otp.trim(), 
          new_password: resetPassword 
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✅ ${t.toastSuccess}`, data.message || t.resetSuccess);
        setResetPassword('');
        setResetConfirmPassword('');
        setOtp('');
        setResetEmail('');
        setIsOtpVerified(false);
        setCurrentScreen('login');
      } else {
        showNotification('error', `❌ Lỗi`, data.detail || 'Có lỗi xảy ra');
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
    if (currentWorkspace && currentWorkspace !== 'personal') {
      params.append('workspace_id', currentWorkspace);
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchAllLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let url = `${API_URL}/api/all-links`;
      if (currentWorkspace && currentWorkspace !== 'personal') {
        url += `?workspace_id=${currentWorkspace}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
        if (data.length > 0) {
          const targetCode = filterLinkCode === 'all' ? 'all' : filterLinkCode || data[0].short_code;
          fetchLinkAnalytics(targetCode);
        }
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleAuthExpiry = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setCurrentScreen('login');
    showNotification('error', '⚠️ Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
  };

  const fetchLinkAnalytics = async (shortCode = filterLinkCode || 'all') => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const queryString = buildAnalyticsQuery();
      const targetCode = shortCode || (filterLinkCode === 'all' ? 'all' : 'all');
      const response = await fetch(`${API_URL}/api/analytics/${targetCode}${queryString}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/api/workspaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
        setWorkspaces([
          { id: 1, name: 'Team Marketing', role: 'owner' },
          { id: 2, name: 'Dự án Alpha', role: 'editor' }
        ]);
      }
    } catch (err) {
      console.error(err);
      setWorkspaces([
        { id: 1, name: 'Team Marketing', role: 'owner' },
        { id: 2, name: 'Dự án Alpha', role: 'editor' }
      ]);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✅ ${t.toastSuccess || 'Thành công'}`, data.message || 'Tạo nhóm làm việc thành công');
        setIsWorkspaceCreateOpen(false);
        setNewWorkspaceName('');
        fetchWorkspaces();
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
        showNotification('error', `❌ ${t.toastError || 'Lỗi'}`, data.detail || 'Không thể tạo nhóm làm việc');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', `💥 ${t.toastError || 'Lỗi'}`, t.connectBackend || 'Hỏng kết nối');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role_in_workspace: inviteRole })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `✅ ${t.toastSuccess || 'Thành công'}`, data.message || 'Mời thành viên thành công');
        setIsInviteOpen(false);
        setInviteEmail('');
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
        showNotification('error', `❌ ${t.toastError || 'Lỗi'}`, data.detail || 'Không thể mời thành viên');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', `💥 ${t.toastError || 'Lỗi'}`, t.connectBackend || 'Hỏng kết nối');
    }
  };

  const fetchWorkspaceMembers = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaceMembers(data.members || []);
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
        showNotification('error', '❌ Lỗi', 'Không thể lấy danh sách thành viên');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const fetchWorkspaceLinks = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/all-links?workspace_id=${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaceLinks(data || []);
      } else {
        if (response.status === 401) {
          handleAuthExpiry();
          return;
        }
        showNotification('error', lang === 'vi' ? '❌ Lỗi' : '❌ Error', lang === 'vi' ? 'Không thể lấy danh sách liên kết.' : 'Unable to retrieve links.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', lang === 'vi' ? '💥 Lỗi' : '💥 Error', lang === 'vi' ? 'Hỏng kết nối.' : 'Connection failed.');
    }
  };

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      const usersRes = await fetch(`${API_URL}/api/admin/users`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAdminUsers(usersData.users || []);
      }

      const linksRes = await fetch(`${API_URL}/api/admin/links`, { headers });
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setAdminLinks(linksData.links || []);
      }

      const wsRes = await fetch(`${API_URL}/api/admin/workspaces`, { headers });
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setAdminWorkspaces(wsData.workspaces || []);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
  };

  // --- ADMIN USERS CRUD ACTIONS ---
  const handleAdminUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let url = `${API_URL}/api/admin/users`;
      let method = 'POST';
      let payload = {
        email: adminUserEmail.trim(),
        username: adminUserUsername.trim(),
        password: adminUserPassword,
        role: adminUserRole
      };

      if (adminEditingUser) {
        url = `${API_URL}/api/admin/users/${adminEditingUser.id}`;
        method = 'PUT';
        payload = {
          username: adminUserUsername.trim(),
          role: adminUserRole
        };
        if (adminUserPassword) {
          payload.password = adminUserPassword;
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', '📋 Thành công', data.message || 'Thao tác người dùng thành công!');
        setIsAdminUserModalOpen(false);
        setAdminEditingUser(null);
        setAdminUserEmail('');
        setAdminUserUsername('');
        setAdminUserPassword('');
        setAdminUserRole('member');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail || 'Không thể thực hiện yêu cầu.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleAdminDeleteUser = async (userId) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa người dùng này? Tất cả các liên kết liên quan sẽ bị xóa!' : 'Are you sure you want to delete this user? All associated links will be removed!')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '🗑️ Thành công', data.message || 'Đã xóa người dùng.');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  // --- ADMIN LINKS CRUD ACTIONS ---
  const handleAdminLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let url = `${API_URL}/api/admin/links`;
      let method = 'POST';
      let payload = {
        url: adminLinkUrl.trim(),
        name: adminLinkName.trim(),
        alias: adminLinkAlias.trim() || null,
        expired_at: adminLinkExpiredAt ? new Date(adminLinkExpiredAt).toISOString() : null,
        owner_email: adminLinkOwnerEmail.trim() || null
      };

      if (adminEditingLink) {
        url = `${API_URL}/api/admin/links/${adminEditingLink.id}`;
        method = 'PUT';
        payload = {
          short_code: adminLinkAlias.trim(),
          name: adminLinkName.trim(),
          original_url: adminLinkUrl.trim(),
          status: adminLinkStatus,
          expired_at: adminLinkExpiredAt ? new Date(adminLinkExpiredAt).toISOString() : null
        };
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', '📋 Thành công', data.message || 'Thao tác liên kết thành công!');
        setIsAdminLinkModalOpen(false);
        setAdminEditingLink(null);
        setAdminLinkUrl('');
        setAdminLinkAlias('');
        setAdminLinkName('');
        setAdminLinkOwnerEmail('');
        setAdminLinkExpiredAt('');
        setAdminLinkStatus('active');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail || 'Không thể thực hiện yêu cầu.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleAdminDeleteLink = async (linkId) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa liên kết này?' : 'Are you sure you want to delete this link?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '🗑️ Thành công', data.message || 'Đã xóa liên kết.');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  // --- ADMIN WORKSPACES CRUD ACTIONS ---
  const handleAdminWorkspaceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let url = `${API_URL}/api/admin/workspaces`;
      let method = 'POST';
      let payload = {
        name: adminWorkspaceName.trim(),
        owner_email: adminWorkspaceOwnerEmail.trim()
      };

      if (adminEditingWorkspace) {
        url = `${API_URL}/api/admin/workspaces/${adminEditingWorkspace.id}`;
        method = 'PUT';
        payload = {
          name: adminWorkspaceName.trim()
        };
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', '📋 Thành công', data.message || 'Thao tác nhóm thành công!');
        setIsAdminWorkspaceModalOpen(false);
        setAdminEditingWorkspace(null);
        setAdminWorkspaceName('');
        setAdminWorkspaceOwnerEmail('');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail || 'Không thể thực hiện yêu cầu.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleAdminDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa nhóm này? Tất cả thành viên và liên kết của nhóm sẽ bị xóa!' : 'Are you sure you want to delete this workspace? All members and workspace links will be removed!')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '🗑️ Thành công', data.message || 'Đã xóa nhóm.');
        fetchAdminData();
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role_in_workspace: newRole })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '📋 Thành công', data.message);
        fetchWorkspaceMembers(selectedWorkspaceId);
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleDeleteMember = async (userId) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?' : 'Are you sure you want to remove this member?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '📋 Thành công', data.message);
        fetchWorkspaceMembers(selectedWorkspaceId);
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role') || 'member';
    if (token) {
      if (savedUser) setUsername(savedUser);
      setUserRole(savedRole);
      setCurrentScreen('dashboard');
      fetchAllLinks();
      fetchWorkspaces();
    }

    // Không dùng token JWT để reset mật khẩu nữa

    fetch(`${API_URL}/api/system/alerts`)
      .then(res => res.json()).then(d => { if (d.status === 'success') setSystemAlerts(d.alerts); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentScreen === 'dashboard') {
      fetchAllLinks();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentScreen !== 'dashboard') return;
    if (links.length === 0) return;
    const targetCode = filterLinkCode === 'all' ? 'all' : filterLinkCode;
    fetchLinkAnalytics(targetCode);
  }, [filterMode, filterStartDate, filterEndDate, filterLinkCode, currentScreen, links.length]);

  const getPeakClickDate = () => {
    if (!analyticsData?.charts?.clicks_over_time) return null;
    const entries = Object.entries(analyticsData.charts.clicks_over_time);
    if (entries.length === 0) return null;
    
    let peakDate = '';
    let maxClicks = -1;
    for (const [date, count] of entries) {
      if (count > maxClicks) {
        maxClicks = count;
        peakDate = date;
      }
    }
    
    const parts = peakDate.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : peakDate;
    return { date: formattedDate, clicks: maxClicks };
  };

  // const handleOAuthLogin = (provider) => {
  //   setOauthProvider(provider);
  //   setCustomOAuthEmail('');
  //   setIsOAuthSimOpen(true);
  // };

  // const submitOAuthLogin = async (email, name) => {
  //   try {
  //     const response = await fetch(`${API_URL}/api/auth/oauth`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         provider: oauthProvider,
  //         email: email.trim(),
  //         name: name
  //       })
  //     });
  //     const data = await response.json();
  //     if (response.ok) {
  //       localStorage.setItem('token', data.access_token);
  //       localStorage.setItem('username', email.trim().split('@')[0]);
  //       showNotification('success', '✅ Đăng nhập mạng xã hội', data.message);
  //       setIsOAuthSimOpen(false);
  //       setCurrentScreen('dashboard');
  //       fetchAllLinks();
  //     } else {
  //       showNotification('error', '❌ Lỗi OAuth', data.detail);
  //     }
  //   } catch (err) {
  //     showNotification('error', '💥 Lỗi', 'Hỏng kết nối backend.');
  //   }
  // };

  const handleToggleLinkStatus = async (shortCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/links/${shortCode}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✅ Thành công', data.message);
        fetchAllLinks();
      } else {
        showNotification('error', '❌ Lỗi', data.detail || 'Không thể thay đổi trạng thái');
      }
    } catch (err) {
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleDeleteLink = async (link) => {
    const isActive = link.status === 'active';
    let force = false;
    
    if (isActive) {
      const confirmMsg = lang === 'vi' 
        ? 'Liên kết này đang chạy chiến dịch. Chỉ có thể xóa các liên kết đã kết thúc chiến dịch. Bạn có muốn kết thúc chiến dịch và xóa liên kết này ngay lập tức không?'
        : 'This link is currently active. Do you want to end the campaign and delete this link immediately?';
      if (!window.confirm(confirmMsg)) return;
      force = true;
    } else {
      const confirmMsg = lang === 'vi' 
        ? 'Bạn có chắc chắn muốn xóa liên kết rút gọn này?' 
        : 'Are you sure you want to delete this shortened link?';
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/links/${link.short_code}?force=${force}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✅ Thành công', data.message);
        fetchAllLinks();
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const openEditModal = (link) => {
    setEditingShortCode(link.short_code);
    setEditLinkStatus(link.status);
    setEditLinkName(link.name || '');
    
    if (link.expired_at) {
      try {
        const date = new Date(link.expired_at);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
        setEditExpiredAt(localISOTime);
      } catch (e) {
        setEditExpiredAt('');
      }
    } else {
      setEditExpiredAt('');
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/links/${editingShortCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editLinkStatus === 'paused' ? editLinkName : undefined,
          expired_at: editExpiredAt ? new Date(editExpiredAt).toISOString() : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✅ Thành công', data.message);
        setIsEditModalOpen(false);
        fetchAllLinks();
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) {
      showNotification('error', '💥 Lỗi', 'Hỏng kết nối.');
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          url: longUrl,
          name: linkName || null,
          alias: customAlias || null,
          domain: customDomain || null,
          params: linkParams || null,
          workspace_id: selectedWorkspaceForLink ? parseInt(selectedWorkspaceForLink) : null,
          expired_at: expiredAt ? new Date(expiredAt).toISOString() : null,
          password: linkPassword || null
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✨ Thành công', data.message || 'Tạo liên kết rút gọn thành công!');
        setCreatedShortUrl(data.short_url || `${API_URL}/${data.short_code}`);
        setSelectedShortCode(data.short_code);
        setIsSuccessOpen(true);
        setIsCreateOpen(false);
        setLongUrl(''); setLinkName(''); setCustomAlias(''); setCustomDomain(''); setLinkParams(''); setExpiredAt(''); setLinkPassword('');
        fetchAllLinks();
        fetchLinkAnalytics(data.short_code);
      } else {
        showNotification('error', '❌ Lỗi', data.detail);
      }
    } catch (err) { showNotification('error', '💥 Lỗi', 'Hỏng kết nối.'); }
  };

  const renderChartSVG = () => {
    let data = [0, 0];
    let labels = ['', ''];
    
    if (analyticsData?.charts?.clicks_over_time) {
      const entries = Object.entries(analyticsData.charts.clicks_over_time);
      if (entries.length > 0) {
        labels = entries.map(([date]) => {
          const parts = date.split('-');
          return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
        });
        data = entries.map(([, val]) => val);
        
        if (data.length === 1) {
          data = [0, data[0]];
          labels = ['', labels[0]];
        }
      }
    } else {
      data = [15, 25, 18, 42, 30, 65, 45, 78, 52, 95, 80, 110];
      labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
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
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt[0]} cy={pt[1]} r="3" fill="#fd79a8" stroke="#111118" strokeWidth="1.5" />
            {idx % Math.ceil(n / 6) === 0 && (
              <text x={pt[0]} y={H - 5} textAnchor="middle" fontSize="8" fill="rgba(122,122,154,0.6)">{labels[idx]}</text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className={`flex min-h-screen ${theme === 'light' ? 'light-theme' : ''} text-[#e8e8f0] bg-[#0a0a0f]`}>
      {toast.show && (
        <div className="fixed top-5 right-5 z-[9999] p-4 rounded-xl border flex items-start gap-3 w-[340px] shadow-2xl backdrop-blur-md"
          style={{ backgroundColor: toast.type === 'success' ? 'rgba(85,239,196,0.1)' : 'rgba(255,118,117,0.1)', borderColor: toast.type === 'success' ? '#55efc4' : '#ff7675' }}>
          <div className="text-xs font-bold uppercase">{toast.title}</div>
          <div className="text-[11px] mt-1">{toast.message}</div>
        </div>
      )}
      
      {currentScreen === 'login' && (
        <div className="w-full min-h-screen flex items-center justify-center p-6 md:p-12 relative bg-[#0a0a0f] overflow-y-auto">
          
          {/* Đa ngôn ngữ & Sáng tối đặt ở góc trên cùng bên phải */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer">
              <option value="vi">VN</option>
              <option value="en">EN</option>
            </select>
            <select value={theme} onChange={(e) => { setTheme(e.target.value); localStorage.setItem('theme', e.target.value); }} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer">
              <option value="dark">{lang === 'vi' ? 'Tối' : 'Dark'}</option>
              <option value="light">{lang === 'vi' ? 'Sáng' : 'Light'}</option>
            </select>
          </div>

          {/* Wrapper căn chỉnh khoảng cách giống Facebook */}
          <div className="w-full max-w-[980px] flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 mx-auto py-12">
            {/* CỘT TRÁI: LOGO & SLOGAN */}
            <div className="w-full max-w-[400px] text-center md:text-left flex flex-col justify-center select-none shrink-0">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#6c5ce7] mb-4">
                SLink<span className="text-[#a29bfe]">Track</span>
              </h1>
              <h2 className="text-sm md:text-lg font-medium text-[#e8e8f0] leading-relaxed">
                {t.primaryTitle}
              </h2>
            </div>

            {/* CỘT PHẢI: THẺ ĐĂNG NHẬP (LOGIN CARD) */}
            <div className="w-full max-w-[396px] shrink-0">
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.1)] flex flex-col gap-4">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  {/* Email address field */}
                  <input 
                    required 
                    type="text" 
                    className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-xs text-white outline-none font-mono" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder={t.usernameOrEmail} 
                  />

                  {/* Password field */}
                  <div className="relative flex items-center">
                    <input 
                      required 
                      type={showLoginPassword ? 'text' : 'password'} 
                      className="w-full bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 pr-10 text-xs text-white outline-none font-mono" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder={t.password} 
                    />
                    <button type="button" className="absolute right-3 text-xs opacity-70 hover:opacity-100" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                      {showLoginPassword ? '👁️' : '🙈'}
                    </button>
                  </div>

                  {/* Login button */}
                  <button type="submit" className="bg-[#6c5ce7] text-white text-sm font-bold py-3 rounded-lg cursor-pointer hover:bg-[#5b4bc4] transition-colors">
                    {t.login}
                  </button>

                  {/* Forgot password button */}
                  <button type="button" onClick={() => setCurrentScreen('forgot')} className="text-center text-xs text-[#a29bfe] hover:underline cursor-pointer block mt-1">
                    {t.forgot}
                  </button>
                </form>

                {/* Login with social accounts (Commented out)
                <div className="flex flex-col gap-2 mt-1">
                  <button 
                    type="button" 
                    onClick={() => handleOAuthLogin('google')}
                    className="w-full bg-white text-black hover:bg-gray-100 border border-gray-300 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors text-[11px]"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google logo" className="w-4 h-4" />
                    {lang === 'vi' ? 'Đăng nhập bằng Google' : 'Sign in with Google'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOAuthLogin('facebook')}
                    className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors text-[11px]"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/51/Facebook_f_logo_%282019%29.svg" alt="Facebook logo" className="w-4 h-4" />
                    {lang === 'vi' ? 'Đăng nhập bằng Facebook' : 'Log in with Facebook'}
                  </button>
                </div>
                */}

                {/* Separator line */}
                <hr className="border-t border-[rgba(255,255,255,0.07)] my-1" />

                {/* Green register button */}
                <button 
                  type="button" 
                  onClick={() => setCurrentScreen('register')} 
                  className="bg-[#42b72a] hover:bg-[#36a420] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors mx-auto block cursor-pointer whitespace-nowrap"
                >
                  {lang === 'vi' ? 'Tạo tài khoản mới' : 'Create new account'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {currentScreen === 'register' && (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-2xl w-[400px] p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00cec9] to-[#6c5ce7]"></div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0] whitespace-nowrap shrink-0">{t.register}</div>
              <div className="flex gap-2">
                <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer">
                  <option value="vi">VN</option>
                  <option value="en">EN</option>
                </select>
                <select value={theme} onChange={(e) => { setTheme(e.target.value); localStorage.setItem('theme', e.target.value); }} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer">
                  <option value="dark">{lang === 'vi' ? 'Tối' : 'Dark'}</option>
                  <option value="light">{lang === 'vi' ? 'Sáng' : 'Light'}</option>
                </select>
              </div>
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
            <div className="text-2xl font-extrabold text-[#e8e8f0] mb-6">{t.forgotTitle}</div>
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
            <div className="text-2xl font-extrabold text-[#e8e8f0] mb-6">{t.resetTitle}</div>
            
            {!isOtpVerified ? (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="rounded-xl bg-[#14141c] border border-[rgba(255,255,255,0.06)] p-4 text-[11px] text-[#7a7a9a]">
                  {lang === 'vi' 
                    ? `Mã OTP đã được gửi đến email ${resetEmail}. Mã có hiệu lực trong 5 phút.` 
                    : `OTP code sent to email ${resetEmail}. Valid for 5 minutes.`}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Mã OTP (6 chữ số)' : 'OTP Code (6 digits)'}</label>
                  <div className="flex gap-2">
                    <input required type="text" maxLength={6} className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none font-mono flex-1 text-center text-lg tracking-widest" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
                    
                    <button 
                      type="button" 
                      disabled={countdown > 0} 
                      onClick={handleResendOtp}
                      className={`text-xs px-3 rounded-lg font-bold transition-all cursor-pointer ${countdown > 0 ? 'bg-[#18181f] text-[#7a7a9a] border border-[rgba(255,255,255,0.05)] cursor-not-allowed' : 'bg-[#6c5ce7] text-white hover:bg-[#5b4bc4]'}`}
                    >
                      {countdown > 0 
                        ? (lang === 'vi' ? `Gửi lại (${countdown}s)` : `Resend (${countdown}s)`) 
                        : (lang === 'vi' ? 'Gửi lại OTP' : 'Resend OTP')}
                    </button>
                  </div>
                </div>
                <button type="submit" className="bg-[#6c5ce7] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                  {lang === 'vi' ? 'Xác thực OTP' : 'Verify OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                <div className="rounded-xl bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] p-4 text-[11px] text-[#4ade80] text-center">
                  {lang === 'vi' ? '✅ Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.' : '✅ OTP Verified successfully! Please enter your new password.'}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Mật khẩu mới' : 'New password'}</label>
                  <input required type={showRegPassword ? 'text' : 'password'} className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{t.confirmPassword}</label>
                  <input required type={showRegConfirmPassword ? 'text' : 'password'} className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
                </div>

                <button type="submit" className="bg-[#4ade80] text-[#0a0a0f] text-xs font-bold py-2.5 rounded-xl cursor-pointer">{t.resetSubmit}</button>
              </form>
            )}
            
            <div className="text-center text-xs text-[#7a7a9a] mt-5"><button className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => { setCurrentScreen('login'); setIsOtpVerified(false); }}>{t.backToLogin}</button></div>
          </div>
        </div>
      )}

      {currentScreen === 'dashboard' && (
        <div className="flex w-full min-h-screen text-[#e8e8f0]">
          <aside className="w-[220px] bg-[#111118] border-r border-[rgba(255,255,255,0.07)] flex flex-col py-6 fixed top-0 left-0 bottom-0">
            <div className="px-5 pb-7 flex items-center gap-2.5">
              <div className="text-xl font-extrabold text-[#e8e8f0]">SLink<span className="text-[#a29bfe]">Track</span></div>
            </div>
            <div className="px-3 mb-1 flex-1">
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${currentScreen === 'dashboard' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('dashboard')}>📊 {t.dashboardTitle}</div>
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'workspaces' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('workspaces')}>👥 {t.workspaces}</div>
              {(userRole === 'admin' || username.toLowerCase().startsWith('admin')) && (
                <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'admin' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => { fetchAdminData(); setCurrentScreen('admin'); }}>
                  ⚙️ {lang === 'vi' ? 'Quản trị hệ thống' : 'System Admin'}
                </div>
              )}
            </div>
            <div className="px-5 pt-4 border-t border-[rgba(255,255,255,0.07)] flex justify-between items-center">
              <div className="text-[11px] font-semibold truncate max-w-[80px]">{username}</div>
              <button className="text-[10px] text-[#ff7675] cursor-pointer" onClick={() => { localStorage.clear(); setCurrentScreen('login'); }}>{t.logout}</button>
            </div>
          </aside>

          <div className="ml-[220px] flex-1 flex flex-col">
            <div className="bg-[#111118] border-b border-[rgba(255,255,255,0.07)] px-7 py-3.5 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold">{t.dashboardTitle || 'Dashboard'}</div>
                <select className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-xs text-white outline-none" value={currentWorkspace} onChange={(e) => setCurrentWorkspace(e.target.value)}>
                  <option value="personal">{lang === 'vi' ? 'Cá nhân' : 'Personal'}</option>
                  {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer" onClick={() => setIsCreateOpen(true)}>{t.createLink}</button>
                <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="vi">VN</option>
                  <option value="en">EN</option>
                </select>
                <select value={theme} onChange={(e) => { setTheme(e.target.value); localStorage.setItem('theme', e.target.value); }} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="dark">{lang === 'vi' ? 'Tối' : 'Dark'}</option>
                  <option value="light">{lang === 'vi' ? 'Sáng' : 'Light'}</option>
                </select>
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
                <div className="col-span-2 bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 flex flex-col">
                  
                  {/* BỘ LỌC BIỂU ĐỒ */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[rgba(255,255,255,0.04)]">
                    <div className="text-xs font-bold text-[#a29bfe] uppercase">{lang === 'vi' ? '📊 Thống kê lượt click' : '📊 Click Statistics'}</div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Lọc theo Link */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Chọn liên kết:' : 'Select link:'}</label>
                        <select className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-[11px] text-white outline-none" value={filterLinkCode} onChange={(e) => setFilterLinkCode(e.target.value)}>
                          <option value="all">{t.allLinks}</option>
                          {links.map((link, idx) => (
                            <option key={idx} value={link.short_code}>/{link.short_code} ({link.name || (lang === 'vi' ? 'Không tên' : 'No name')})</option>
                          ))}
                        </select>
                      </div>

                      {/* Lọc theo thời gian */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Thời gian:' : 'Time range:'}</label>
                        <select className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-[11px] text-white outline-none" value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                          <option value="today">{lang === 'vi' ? 'Hôm nay' : 'Today'}</option>
                          <option value="7days">{lang === 'vi' ? '7 ngày qua' : 'Last 7 days'}</option>
                          <option value="30days">{lang === 'vi' ? '30 ngày qua' : 'Last 30 days'}</option>
                          <option value="custom">{lang === 'vi' ? 'Tùy chỉnh' : 'Custom range'}</option>
                        </select>
                      </div>

                      {/* Chọn khoảng ngày tùy chỉnh */}
                      {filterMode === 'custom' && (
                        <div className="flex items-center gap-1.5">
                          <input type="date" className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-0.5 text-[11px] text-white outline-none" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                          <span className="text-[10px] text-[#7a7a9a]">-</span>
                          <input type="date" className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-0.5 text-[11px] text-white outline-none" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-[150px] w-full">{renderChartSVG()}</div>
                </div>
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 flex flex-col items-center justify-center">
                  {analyticsData?.link_info?.short_code && analyticsData.link_info.short_code !== 'all' ? (
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
                      <th className="p-4 text-center">{t.copy}</th>
                      <th className="p-4">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th className="p-4 text-center">{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link, idx) => (
                      <tr key={idx} className="border-b border-[rgba(255,255,255,0.04)] cursor-pointer" onClick={() => openLinkDetails(link.short_code)}>
                        <td className="p-4 text-xs font-mono text-[#a29bfe]">/{link.short_code}</td>
                        <td className="p-4 text-xs font-mono">{link.clicks}</td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}><button className="bg-[#18181f] px-2 py-1 border border-[rgba(255,255,255,0.1)] text-xs rounded cursor-pointer" onClick={() => { setSelectedShortCode(link.short_code); setIsQrOpen(true); }}>◼</button></td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="bg-[#18181f] px-3 py-1 border border-[rgba(255,255,255,0.1)] text-xs rounded cursor-pointer hover:bg-[rgba(108,92,231,0.1)] hover:text-[#a29bfe] transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(`${API_URL}/${link.short_code}`);
                              showNotification('success', '📋 Thành Công', t.linkCopied);
                            }}
                          >
                            📋 {t.copy}
                          </button>
                        </td>
                        <td className="p-4 text-xs" onClick={(e) => e.stopPropagation()}>
                          {link.status === 'active' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(85,239,196,0.15)] text-[#2ed573]">
                              {lang === 'vi' ? 'Đang chạy' : 'Running'}
                            </span>
                          )}
                          {link.status === 'paused' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(253,203,110,0.15)] text-[#eccc68]">
                              {lang === 'vi' ? 'Đang tạm dừng' : 'Paused'}
                            </span>
                          )}
                          {link.status === 'expired' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,118,117,0.15)] text-[#ff4757]">
                              {lang === 'vi' ? 'Đã kết thúc' : 'Ended'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {link.status !== 'expired' ? (
                            <button 
                              onClick={() => handleToggleLinkStatus(link.short_code)}
                              className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${link.status === 'active' ? 'bg-[rgba(253,203,110,0.15)] border-[rgba(253,203,110,0.3)] text-[#eccc68] hover:bg-[rgba(253,203,110,0.3)]' : 'bg-[rgba(85,239,196,0.15)] border-[rgba(85,239,196,0.3)] text-[#2ed573] hover:bg-[rgba(85,239,196,0.3)]'}`}
                            >
                              {link.status === 'active' ? (lang === 'vi' ? '⏸️ Dừng' : 'Pause') : (lang === 'vi' ? '▶️ Chạy' : 'Run')}
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#7a7a9a]">-</span>
                          )}

                          {link.status !== 'expired' ? (
                            <button 
                              onClick={() => openEditModal(link)}
                              className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-2 py-1 text-[10px] rounded text-white hover:bg-[rgba(108,92,231,0.15)] hover:text-[#a29bfe] cursor-pointer transition-colors"
                            >
                              {lang === 'vi' ? '✏️ Sửa' : 'Edit'}
                            </button>
                          ) : (
                            <button 
                              disabled 
                              className="bg-[#18181f] border border-[rgba(255,255,255,0.03)] px-2 py-1 text-[10px] rounded text-[#4a4a6a] cursor-not-allowed"
                              title={lang === 'vi' ? 'Liên kết đã kết thúc không thể sửa đổi' : 'Ended links cannot be edited'}
                            >
                              🔒 {lang === 'vi' ? 'Sửa' : 'Edit'}
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteLink(link)}
                            className="bg-[rgba(255,118,117,0.12)] hover:bg-[rgba(255,118,117,0.25)] border border-[rgba(255,118,117,0.2)] text-[#ff7675] px-2 py-1 text-[10px] rounded cursor-pointer transition-colors"
                          >
                            🗑️ {lang === 'vi' ? 'Xóa' : 'Delete'}
                          </button>
                        </td>
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
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                <div className="text-[11px] text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Ngày nhiều click nhất' : 'Peak click date'}</div>
                <div className="text-lg font-bold text-[#fdcb6e] mt-2">
                  {(() => {
                    const peak = getPeakClickDate();
                    return peak ? `${peak.date} (${peak.clicks} clicks)` : 'N/A';
                  })()}
                </div>
              </div>
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                <div className="text-[11px] text-[#7a7a9a] uppercase mb-2">{t.domainLabel}</div>
                <div className="text-xs text-[#e8e8f0] break-all truncate" title={analyticsData?.link_info?.original_url}>
                  {analyticsData?.link_info?.original_url || '-'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {analyticsData?.charts && Object.entries(analyticsData.charts)
                .filter(([label]) => label !== 'clicks_over_time')
                .map(([label, values]) => {
                  let labelText = label;
                  if (label === 'devices') labelText = lang === 'vi' ? '📱 Thiết bị' : 'Devices';
                  else if (label === 'operating_systems') labelText = lang === 'vi' ? '💻 Hệ điều hành' : 'Operating Systems';
                  else if (label === 'browsers') labelText = lang === 'vi' ? '🌐 Trình duyệt' : 'Browsers';
                  else if (label === 'traffic_sources') labelText = lang === 'vi' ? '🚦 Nguồn truy cập' : 'Traffic Sources';
                  
                  return (
                    <div key={label} className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5">
                      <div className="text-[11px] text-[#7a7a9a] uppercase mb-3 font-bold">{labelText}</div>
                      <div className="space-y-2">
                        {Object.entries(values).map(([key, count]) => (
                          <div key={key} className="text-xs flex justify-between">
                            <span className="text-[#e8e8f0] truncate max-w-[130px]">{key}</span>
                            <span className="font-bold text-[#a29bfe]">{count}</span>
                          </div>
                        ))}
                        {Object.keys(values).length === 0 && (
                          <div className="text-xs italic text-[#7a7a9a]">Chưa có dữ liệu.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {analyticsData?.edit_history && analyticsData.edit_history.length > 0 && (
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden mb-6">
                <div className="p-4 bg-[#14141c] font-bold text-sm text-[#fdcb6e] flex items-center gap-2">🕰️ {lang === 'vi' ? 'Lịch sử chỉnh sửa thời gian kết thúc' : 'Expiration Date Edit History'}</div>
                <div className="p-4 space-y-2">
                  {analyticsData.edit_history.map((hist, index) => (
                    <div key={index} className="text-xs flex flex-col md:flex-row md:justify-between border-b border-[rgba(255,255,255,0.04)] pb-2 last:border-b-0">
                      <div>
                        <span className="text-[#7a7a9a]">{lang === 'vi' ? 'Thay đổi từ ' : 'Changed from '}</span>
                        <span className="font-mono text-[#ff7675]">{hist.old_expired_at}</span>
                        <span className="text-[#7a7a9a]"> ➜ </span>
                        <span className="font-mono text-[#55efc4]">{hist.new_expired_at}</span>
                      </div>
                      <div className="text-[11px] text-[#7a7a9a] mt-1 md:mt-0 font-mono">
                        {lang === 'vi' ? 'Bởi: ' : 'By: '} <span className="text-[#a29bfe]">{hist.edited_by}</span> | {hist.edited_at}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase px-1">
                  {lang === 'vi' ? 'Nhập liên kết gốc' : 'Enter original link'}
                </label>
                <input required type="url" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder={t.longUrlPlaceholder} />
              </div>
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder={t.linkNameLabel} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} placeholder={t.customAliasPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder={t.domainPlaceholder} />
              <input type="text" autoComplete="off" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkParams} onChange={(e) => setLinkParams(e.target.value)} placeholder={t.paramsPlaceholder} />
              <input type="password" autoComplete="new-password" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} placeholder={lang === 'vi' ? 'Mật khẩu bảo vệ (Không bắt buộc)' : 'Protection password (Optional)'} />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase px-1">{lang === 'vi' ? 'Ngày hết hạn (Không bắt buộc)' : 'Expiration date (Optional)'}</label>
                <input 
                  type="datetime-local" 
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none cursor-pointer" 
                  value={expiredAt} 
                  onChange={(e) => setExpiredAt(e.target.value)} 
                />
              </div>
              <select className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white outline-none" value={selectedWorkspaceForLink} onChange={(e) => setSelectedWorkspaceForLink(e.target.value)}>
                <option value="">-- {lang === 'vi' ? 'Cá nhân' : 'Personal'} --</option>
                {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
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
            <div className="text-xs font-mono bg-[#18181f] py-1 px-3 border border-[rgba(255,255,255,0.05)] rounded">{API_URL.replace("https://", "").replace("http://", "")}/{selectedShortCode}</div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA LINK */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[400px] p-6 shadow-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between">
              <span>✏️ {lang === 'vi' ? 'Chỉnh sửa liên kết' : 'Edit Link'}</span>
              <button className="text-sm font-normal text-[#7a7a9a] cursor-pointer" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </h3>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {editLinkStatus === 'paused' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase px-1">
                    {lang === 'vi' ? 'Tên liên kết (Có thể sửa khi đang tạm dừng)' : 'Link Name (Editable when paused)'}
                  </label>
                  <input 
                    type="text" 
                    className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                    value={editLinkName} 
                    onChange={(e) => setEditLinkName(e.target.value)} 
                    placeholder={lang === 'vi' ? 'Tên liên kết...' : 'Link name...'} 
                  />
                </div>
              )}
              
              {editLinkStatus === 'active' && (
                <div className="rounded-lg bg-[rgba(108,92,231,0.1)] border border-[rgba(108,92,231,0.2)] p-3 text-[11px] text-[#a29bfe]">
                  💡 {lang === 'vi' 
                    ? 'Liên kết đang hoạt động: Bạn chỉ được phép thay đổi thời gian kết thúc chiến dịch.' 
                    : 'Link is active: You are only allowed to modify the expiration date.'}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase px-1">
                  {lang === 'vi' ? 'Thời gian kết thúc (Không được nhỏ hơn ngày sửa)' : 'Expiration date (Must not be in past)'}
                </label>
                <input 
                  type="datetime-local" 
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white font-mono outline-none cursor-pointer" 
                  value={editExpiredAt} 
                  onChange={(e) => setEditExpiredAt(e.target.value)} 
                />
                <span className="text-[9px] text-[#7a7a9a] px-1 mt-0.5">
                  {lang === 'vi' ? '* Xóa trống ngày nếu muốn chạy vô thời hạn' : '* Leave blank for unlimited duration'}
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-1.5 rounded-lg text-xs text-[#7a7a9a] cursor-pointer">
                  {t.cancel}
                </button>
                <button type="submit" className="bg-[#6c5ce7] px-4 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer">
                  {lang === 'vi' ? 'Cập nhật' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MÔ PHỎNG DỊCH VỤ OAUTH SSO (Commented out)
      {isOAuthSimOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in text-black">
          {oauthProvider === 'google' ? (
            <div className="bg-white text-black rounded-2xl w-[360px] p-6 shadow-2xl flex flex-col gap-4 font-sans border border-gray-200">
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-8 h-8" />
                <h3 className="text-base font-semibold text-[#202124]">{lang === 'vi' ? 'Đăng nhập bằng Google' : 'Sign in with Google'}</h3>
                <p className="text-[11px] text-[#5f6368]">{lang === 'vi' ? 'để tiếp tục đến SLinkTrack' : 'to continue to SLinkTrack'}</p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {[
                  { name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com' },
                  { name: 'Trần Thị Bình', email: 'binh.tran@gmail.com' },
                  { name: 'Phan Văn Cường', email: 'cuong.phan@gmail.com' }
                ].map((account) => (
                  <button 
                    key={account.email}
                    type="button"
                    onClick={() => submitOAuthLogin(account.email, account.name)}
                    className="w-full text-left p-3 rounded-lg border border-[#dadce0] hover:bg-[#f8f9fa] transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#6c5ce7] text-white font-bold flex items-center justify-center text-xs uppercase">
                      {account.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#3c4043]">{account.name}</div>
                      <div className="text-[10px] text-[#5f6368]">{account.email}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-[#dadce0] pt-3 flex flex-col gap-2">
                <div className="text-[11px] text-[#5f6368] font-semibold">{lang === 'vi' ? 'Hoặc nhập tài khoản Google khác:' : 'Or enter custom Google account:'}</div>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="example@gmail.com"
                    value={customOAuthEmail}
                    onChange={(e) => setCustomOAuthEmail(e.target.value)}
                    className="flex-1 bg-white border border-[#dadce0] rounded-lg px-3 py-1.5 text-xs text-[#202124] outline-none font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (!customOAuthEmail.includes('@')) {
                        showNotification('warning', '⚠️ Định dạng', 'Vui lòng nhập đúng định dạng email!');
                        return;
                      }
                      submitOAuthLogin(customOAuthEmail, customOAuthEmail.split('@')[0]);
                    }}
                    className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {lang === 'vi' ? 'Tiếp tục' : 'Next'}
                  </button>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsOAuthSimOpen(false)}
                className="w-full text-center text-xs text-[#1a73e8] hover:underline cursor-pointer py-1.5 mt-1 border border-[#dadce0] rounded-lg"
              >
                {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
            </div>
          ) : (
            <div className="bg-[#f0f2f5] text-black rounded-2xl w-[400px] shadow-2xl flex flex-col overflow-hidden font-sans border border-[#dddfe2]">
              <div className="bg-[#1877f2] p-4 text-white flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/51/Facebook_f_logo_%282019%29.svg" alt="FB" className="w-5 h-5 invert brightness-0" />
                  {lang === 'vi' ? 'Đăng nhập bằng Facebook' : 'Log in with Facebook'}
                </span>
                <button type="button" onClick={() => setIsOAuthSimOpen(false)} className="text-white hover:opacity-80 text-sm cursor-pointer">✕</button>
              </div>

              <div className="p-6 flex flex-col gap-4 bg-white">
                <div className="flex gap-4 items-start border-b border-[#dadde1] pb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6c5ce7] text-white flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
                    SL
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1c1e21]">{lang === 'vi' ? 'Tiếp tục truy cập SLinkTrack?' : 'Continue accessing SLinkTrack?'}</h4>
                    <p className="text-[11px] text-[#606770] mt-1 leading-relaxed">
                      {lang === 'vi' 
                        ? 'SLinkTrack sẽ nhận được thông tin công khai: tên, ảnh đại diện và địa chỉ email của bạn.' 
                        : 'SLinkTrack will receive your public profile info: name, avatar, and email address.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    type="button"
                    onClick={() => submitOAuthLogin('fb_user_demo@gmail.com', 'Facebook User')}
                    className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-colors text-center"
                  >
                    {lang === 'vi' ? 'Tiếp tục dưới tên Facebook User' : 'Continue as Facebook User'}
                  </button>
                  <p className="text-[10px] text-[#606770] text-center">{lang === 'vi' ? 'Email liên kết: fb_user_demo@gmail.com' : 'Linked email: fb_user_demo@gmail.com'}</p>
                </div>

                <div className="border-t border-[#dadde1] pt-4 flex flex-col gap-2">
                  <div className="text-[11px] text-[#606770] font-semibold">{lang === 'vi' ? 'Hoặc nhập email Facebook khác:' : 'Or enter custom Facebook email:'}</div>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="facebook_account@gmail.com"
                      value={customOAuthEmail}
                      onChange={(e) => setCustomOAuthEmail(e.target.value)}
                      className="flex-1 bg-white border border-[#ccd0d5] rounded-lg px-3 py-1.5 text-xs text-black outline-none font-mono"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (!customOAuthEmail.includes('@')) {
                          showNotification('warning', '⚠️ Định dạng', 'Vui lòng nhập đúng định dạng email!');
                          return;
                        }
                        submitOAuthLogin(customOAuthEmail, customOAuthEmail.split('@')[0]);
                      }}
                      className="bg-[#42b72a] hover:bg-[#36a420] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {lang === 'vi' ? 'Tiếp tục' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      */}

      {currentScreen === 'workspaces' && (
        <div className="flex w-full min-h-screen text-[#e8e8f0]">
          <aside className="w-[220px] bg-[#111118] border-r border-[rgba(255,255,255,0.07)] flex flex-col py-6 fixed top-0 left-0 bottom-0">
            <div className="px-5 pb-7 flex items-center gap-2.5">
              <div className="text-xl font-extrabold text-[#e8e8f0]">SLink<span className="text-[#a29bfe]">Track</span></div>
            </div>
            <div className="px-3 mb-1 flex-1">
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${currentScreen === 'dashboard' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('dashboard')}>📊 {t.dashboardTitle}</div>
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'workspaces' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('workspaces')}>👥 {t.workspaces}</div>
              {(userRole === 'admin' || username.toLowerCase().startsWith('admin')) && (
                <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'admin' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => { fetchAdminData(); setCurrentScreen('admin'); }}>
                  ⚙️ {lang === 'vi' ? 'Quản trị hệ thống' : 'System Admin'}
                </div>
              )}
            </div>
            <div className="px-5 pt-4 border-t border-[rgba(255,255,255,0.07)] flex justify-between items-center">
              <div className="text-[11px] font-semibold truncate max-w-[80px]">{username}</div>
              <button className="text-[10px] text-[#ff7675] cursor-pointer" onClick={() => { localStorage.clear(); setCurrentScreen('login'); }}>{t.logout}</button>
            </div>
          </aside>

          <div className="ml-[220px] flex-1 flex flex-col">
            <div className="bg-[#111118] border-b border-[rgba(255,255,255,0.07)] px-7 py-3.5 flex items-center justify-between sticky top-0">
              <div className="text-sm font-bold">{t.workspaces}</div>
              <div className="flex items-center gap-2">
                <button className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer" onClick={() => setIsWorkspaceCreateOpen(true)}>{t.createWorkspace}</button>
                <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="vi">VN</option>
                  <option value="en">EN</option>
                </select>
                <select value={theme} onChange={(e) => { setTheme(e.target.value); localStorage.setItem('theme', e.target.value); }} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="dark">{lang === 'vi' ? 'Tối' : 'Dark'}</option>
                  <option value="light">{lang === 'vi' ? 'Sáng' : 'Light'}</option>
                </select>
              </div>
            </div>
            
            <div className="p-7">
              <div className="grid grid-cols-3 gap-4">
                {workspaces.map(ws => (
                  <div key={ws.id} className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 relative">
                    <div className="text-lg font-bold mb-1">{ws.name}</div>
                    <div className="text-[11px] text-[#7a7a9a] mb-4">Role: <span className="text-[#a29bfe] uppercase">{ws.role}</span></div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="text-xs bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg text-[#a29bfe] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors" onClick={() => { setSelectedWorkspaceId(ws.id); setSelectedWorkspaceName(ws.name); fetchWorkspaceMembers(ws.id); setIsMembersListOpen(true); }}>
                        {t.viewMembers}
                      </button>
                      <button className="text-xs bg-[rgba(0,206,201,0.15)] border border-[rgba(0,206,201,0.3)] px-3 py-1.5 rounded-lg text-[#00cec9] cursor-pointer hover:bg-[rgba(0,206,201,0.3)] transition-colors" onClick={() => { setSelectedWorkspaceId(ws.id); setSelectedWorkspaceName(ws.name); fetchWorkspaceLinks(ws.id); setIsWorkspaceLinksOpen(true); }}>
                        🔗 {t.viewLinks}
                      </button>
                      {ws.role === 'owner' && (
                        <button className="text-xs bg-[#6c5ce7] border border-transparent px-3 py-1.5 rounded-lg text-white cursor-pointer hover:bg-[#5b4bc4] transition-colors" onClick={() => { setSelectedWorkspaceId(ws.id); setIsInviteOpen(true); }}>
                          {t.inviteMember}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {workspaces.length === 0 && (
                  <div className="col-span-3 text-sm text-[#7a7a9a] italic">
                    {lang === 'vi' ? 'Bạn chưa tham gia không gian làm việc nào.' : 'You have not joined any workspaces.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'admin' && (
        <div className="flex w-full min-h-screen text-[#e8e8f0]">
          {/* SIDEBAR */}
          <aside className="w-[220px] bg-[#111118] border-r border-[rgba(255,255,255,0.07)] flex flex-col py-6 fixed top-0 left-0 bottom-0 select-none">
            <div className="px-5 pb-7 flex items-center gap-2.5">
              <div className="text-xl font-extrabold text-[#e8e8f0]">SLink<span className="text-[#a29bfe]">Track</span></div>
            </div>
            <div className="px-3 mb-1 flex-1">
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${currentScreen === 'dashboard' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('dashboard')}>📊 {t.dashboardTitle}</div>
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'workspaces' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('workspaces')}>👥 {t.workspaces}</div>
              {(userRole === 'admin' || username.toLowerCase().startsWith('admin')) && (
                <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'admin' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => { fetchAdminData(); setCurrentScreen('admin'); }}>
                  ⚙️ {lang === 'vi' ? 'Quản trị hệ thống' : 'System Admin'}
                </div>
              )}
            </div>
            <div className="px-5 pt-4 border-t border-[rgba(255,255,255,0.07)] flex justify-between items-center">
              <div className="text-[11px] font-semibold truncate max-w-[80px]">{username}</div>
              <button className="text-[10px] text-[#ff7675] cursor-pointer" onClick={() => { localStorage.clear(); setCurrentScreen('login'); }}>{t.logout}</button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="ml-[220px] flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-[#111118] border-b border-[rgba(255,255,255,0.07)] px-7 py-3.5 flex items-center justify-between sticky top-0">
              <div className="text-sm font-bold flex items-center gap-2">
                <span>⚙️ {lang === 'vi' ? 'Hệ thống Quản trị viên' : 'System Administrator Panel'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="text-xs bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors" onClick={fetchAdminData}>
                  🔄 {lang === 'vi' ? 'Làm mới' : 'Refresh'}
                </button>
                <select value={lang} onChange={(e) => updateLanguage(e.target.value)} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="vi">VN</option>
                  <option value="en">EN</option>
                </select>
                <select value={theme} onChange={(e) => { setTheme(e.target.value); localStorage.setItem('theme', e.target.value); }} className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer">
                  <option value="dark">{lang === 'vi' ? 'Tối' : 'Dark'}</option>
                  <option value="light">{lang === 'vi' ? 'Sáng' : 'Light'}</option>
                </select>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-7">
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-4 border-b border-[rgba(255,255,255,0.07)] pb-3">
                <button 
                  onClick={() => setAdminTab('users')}
                  className={`text-xs px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${adminTab === 'users' ? 'bg-[#6c5ce7] text-white' : 'bg-[#111118] text-[#7a7a9a] border border-[rgba(255,255,255,0.05)] hover:text-white'}`}
                >
                  👥 {lang === 'vi' ? 'Người dùng' : 'Users'} ({adminUsers.length})
                </button>
                <button 
                  onClick={() => setAdminTab('links')}
                  className={`text-xs px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${adminTab === 'links' ? 'bg-[#6c5ce7] text-white' : 'bg-[#111118] text-[#7a7a9a] border border-[rgba(255,255,255,0.05)] hover:text-white'}`}
                >
                  🔗 {lang === 'vi' ? 'Liên kết rút gọn' : 'Shortened Links'} ({adminLinks.length})
                </button>
                <button 
                  onClick={() => setAdminTab('workspaces')}
                  className={`text-xs px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${adminTab === 'workspaces' ? 'bg-[#6c5ce7] text-white' : 'bg-[#111118] text-[#7a7a9a] border border-[rgba(255,255,255,0.05)] hover:text-white'}`}
                >
                  🏢 {lang === 'vi' ? 'Nhóm' : 'Workspaces'} ({adminWorkspaces.length})
                </button>
              </div>

              {/* Actions Header Bar */}
              <div className="flex justify-between items-center mb-6 bg-[#14141c] border border-[rgba(255,255,255,0.05)] p-4 rounded-xl shadow-lg">
                <div className="text-xs text-[#7a7a9a]">
                  {lang === 'vi' ? 'Thực hiện thêm mới, chỉnh sửa thông tin hoặc xóa các bản ghi hệ thống.' : 'Create, edit or delete system records dynamically.'}
                </div>
                <div>
                  {adminTab === 'users' && (
                    <button 
                      onClick={() => {
                        setAdminEditingUser(null);
                        setAdminUserEmail('');
                        setAdminUserUsername('');
                        setAdminUserPassword('');
                        setAdminUserRole('member');
                        setIsAdminUserModalOpen(true);
                      }}
                      className="bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ➕ {lang === 'vi' ? 'Thêm người dùng' : 'Add User'}
                    </button>
                  )}
                  {adminTab === 'links' && (
                    <button 
                      onClick={() => {
                        setAdminEditingLink(null);
                        setAdminLinkUrl('');
                        setAdminLinkAlias('');
                        setAdminLinkName('');
                        setAdminLinkOwnerEmail('');
                        setAdminLinkExpiredAt('');
                        setAdminLinkStatus('active');
                        setIsAdminLinkModalOpen(true);
                      }}
                      className="bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ➕ {lang === 'vi' ? 'Thêm liên kết' : 'Add Link'}
                    </button>
                  )}
                  {adminTab === 'workspaces' && (
                    <button 
                      onClick={() => {
                        setAdminEditingWorkspace(null);
                        setAdminWorkspaceName('');
                        setAdminWorkspaceOwnerEmail('');
                        setIsAdminWorkspaceModalOpen(true);
                      }}
                      className="bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ➕ {lang === 'vi' ? 'Tạo Nhóm mới' : 'Create Workspace'}
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content: Users */}
              {adminTab === 'users' && (
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden shadow-xl animate-fade-in">
                  <div className="p-4 bg-[#14141c] font-bold text-xs text-[#a29bfe] uppercase">{lang === 'vi' ? 'Danh sách người dùng hệ thống' : 'System Users Directory'}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#18181f] text-[10px] text-[#7a7a9a] uppercase border-b border-[rgba(255,255,255,0.07)]">
                          <th className="p-4">ID</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">{lang === 'vi' ? 'Tên tài khoản' : 'Username'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Vai trò' : 'Role'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Số liên kết' : 'Links Created'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Số nhóm tham gia' : 'Workspaces Joined'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Ngày tham gia' : 'Joined Date'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="border-b border-[rgba(255,255,255,0.04)] text-xs hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                            <td className="p-4 font-mono text-[#7a7a9a]">{u.id}</td>
                            <td className="p-4 font-mono text-[#e8e8f0]">{u.email}</td>
                            <td className="p-4 font-mono text-[#a29bfe]">{u.username}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.role === 'admin' ? 'bg-[rgba(255,118,117,0.15)] text-[#ff7675]' : 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]'}`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-[#55efc4]">{u.link_count}</td>
                            <td className="p-4 text-center font-mono font-bold text-[#fdcb6e]">{u.workspace_count}</td>
                            <td className="p-4 font-mono text-[#7a7a9a]">{u.created_at}</td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => {
                                    setAdminEditingUser(u);
                                    setAdminUserEmail(u.email);
                                    setAdminUserUsername(u.username !== 'N/A' ? u.username : '');
                                    setAdminUserPassword('');
                                    setAdminUserRole(u.role);
                                    setIsAdminUserModalOpen(true);
                                  }}
                                  className="text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded cursor-pointer transition-colors text-white"
                                >
                                  ✏️ {lang === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <button 
                                  disabled={u.email === 'adminslt@gmail.com'}
                                  onClick={() => handleAdminDeleteUser(u.id)}
                                  className={`text-[10px] px-2 py-1 rounded cursor-pointer transition-colors ${u.email === 'adminslt@gmail.com' ? 'bg-[#18181f] text-[#7a7a9a] cursor-not-allowed opacity-50' : 'bg-[rgba(255,118,117,0.15)] text-[#ff7675] hover:bg-[rgba(255,118,117,0.3)]'}`}
                                >
                                  🗑️ {lang === 'vi' ? 'Xóa' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content: Links */}
              {adminTab === 'links' && (
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden shadow-xl animate-fade-in">
                  <div className="p-4 bg-[#14141c] font-bold text-xs text-[#a29bfe] uppercase">{lang === 'vi' ? 'Danh sách liên kết hệ thống' : 'System Links Directory'}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#18181f] text-[10px] text-[#7a7a9a] uppercase border-b border-[rgba(255,255,255,0.07)]">
                          <th className="p-4">ID</th>
                          <th className="p-4">{t.tableShort}</th>
                          <th className="p-4">{lang === 'vi' ? 'Tên liên kết' : 'Link Name'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Liên kết gốc' : 'Original URL'}</th>
                          <th className="p-4 text-center">{t.tableClicks}</th>
                          <th className="p-4">{lang === 'vi' ? 'Người tạo' : 'Creator Email'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Ngày tạo' : 'Created At'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLinks.map((l) => (
                          <tr key={l.id} className="border-b border-[rgba(255,255,255,0.04)] text-xs hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                            <td className="p-4 font-mono text-[#7a7a9a]">{l.id}</td>
                            <td className="p-4 font-mono text-[#a29bfe]">/{l.short_code}</td>
                            <td className="p-4 text-[#e8e8f0] truncate max-w-[100px]" title={l.name}>{l.name || '—'}</td>
                            <td className="p-4 font-mono text-[#7a7a9a] truncate max-w-[150px]" title={l.original_url}>{l.original_url}</td>
                            <td className="p-4 text-center font-mono font-bold text-[#55efc4]">{l.clicks}</td>
                            <td className="p-4 font-mono text-[#e8e8f0]">{l.owner_email}</td>
                            <td className="p-4">
                              {l.status === 'active' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(85,239,196,0.15)] text-[#2ed573]">
                                  {lang === 'vi' ? 'Đang chạy' : 'Running'}
                                </span>
                              )}
                              {l.status === 'paused' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(253,203,110,0.15)] text-[#eccc68]">
                                  {lang === 'vi' ? 'Tạm dừng' : 'Paused'}
                                </span>
                              )}
                              {l.status === 'expired' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(255,118,117,0.15)] text-[#ff4757]">
                                  {lang === 'vi' ? 'Kết thúc' : 'Ended'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-mono text-[#7a7a9a]">{l.created_at}</td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => {
                                    setAdminEditingLink(l);
                                    setAdminLinkUrl(l.original_url);
                                    setAdminLinkAlias(l.short_code);
                                    setAdminLinkName(l.name || '');
                                    setAdminLinkStatus(l.status);
                                    setAdminLinkExpiredAt(l.expired_at ? l.expired_at : '');
                                    setIsAdminLinkModalOpen(true);
                                  }}
                                  className="text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded cursor-pointer transition-colors text-white"
                                >
                                  ✏️ {lang === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <button 
                                  onClick={() => handleAdminDeleteLink(l.id)}
                                  className="text-[10px] bg-[rgba(255,118,117,0.15)] text-[#ff7675] hover:bg-[rgba(255,118,117,0.3)] px-2 py-1 rounded cursor-pointer transition-colors"
                                >
                                  🗑️ {lang === 'vi' ? 'Xóa' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content: Workspaces */}
              {adminTab === 'workspaces' && (
                <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden shadow-xl animate-fade-in">
                  <div className="p-4 bg-[#14141c] font-bold text-xs text-[#a29bfe] uppercase">{lang === 'vi' ? 'Danh sách nhóm trên hệ thống' : 'System Workspaces Directory'}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#18181f] text-[10px] text-[#7a7a9a] uppercase border-b border-[rgba(255,255,255,0.07)]">
                          <th className="p-4">ID</th>
                          <th className="p-4">{t.workspaceName}</th>
                          <th className="p-4">{lang === 'vi' ? 'Chủ sở hữu' : 'Owner/Creator'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Số thành viên' : 'Members'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Số liên kết' : 'Links'}</th>
                          <th className="p-4">{lang === 'vi' ? 'Ngày lập nhóm' : 'Created At'}</th>
                          <th className="p-4 text-center">{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminWorkspaces.map((w) => (
                          <tr key={w.id} className="border-b border-[rgba(255,255,255,0.04)] text-xs hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                            <td className="p-4 font-mono text-[#7a7a9a]">{w.id}</td>
                            <td className="p-4 font-bold text-[#e8e8f0]">{w.name}</td>
                            <td className="p-4 font-mono text-[#a29bfe]">{w.owner_email}</td>
                            <td className="p-4 text-center font-mono font-bold text-[#fdcb6e]">{w.member_count}</td>
                            <td className="p-4 text-center font-mono font-bold text-[#55efc4]">{w.link_count}</td>
                            <td className="p-4 font-mono text-[#7a7a9a]">{w.created_at}</td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => {
                                    setAdminEditingWorkspace(w);
                                    setAdminWorkspaceName(w.name);
                                    setAdminWorkspaceOwnerEmail(w.owner_email);
                                    setIsAdminWorkspaceModalOpen(true);
                                  }}
                                  className="text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded cursor-pointer transition-colors text-white"
                                >
                                  ✏️ {lang === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <button 
                                  onClick={() => handleAdminDeleteWorkspace(w.id)}
                                  className="text-[10px] bg-[rgba(255,118,117,0.15)] text-[#ff7675] hover:bg-[rgba(255,118,117,0.3)] px-2 py-1 rounded cursor-pointer transition-colors"
                                >
                                  🗑️ {lang === 'vi' ? 'Xóa' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA NGƯỜI DÙNG (ADMIN) */}
      {isAdminUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[400px] p-6 shadow-2xl animate-fade-in text-[#e8e8f0]">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between">
              <span>👥 {adminEditingUser ? (lang === 'vi' ? 'Sửa thông tin người dùng' : 'Edit User') : (lang === 'vi' ? 'Thêm người dùng mới' : 'Add New User')}</span>
              <button className="text-sm font-normal text-[#7a7a9a] hover:text-white" onClick={() => setIsAdminUserModalOpen(false)}>✕</button>
            </h3>
            <form onSubmit={handleAdminUserSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">Email</label>
                <input 
                  required 
                  disabled={!!adminEditingUser}
                  type="email" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none disabled:opacity-50" 
                  value={adminUserEmail} 
                  onChange={(e) => setAdminUserEmail(e.target.value)} 
                  placeholder="user@example.com" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Tên tài khoản (Username)' : 'Username'}</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminUserUsername} 
                  onChange={(e) => setAdminUserUsername(e.target.value)} 
                  placeholder="username" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">
                  {lang === 'vi' ? 'Mật khẩu' : 'Password'} {adminEditingUser && `(${lang === 'vi' ? 'Bỏ trống nếu không đổi' : 'Leave blank to keep'})`}
                </label>
                <input 
                  required={!adminEditingUser}
                  type="password" 
                  autoComplete="new-password"
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminUserPassword} 
                  onChange={(e) => setAdminUserPassword(e.target.value)} 
                  placeholder="******" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Vai trò hệ thống' : 'System Role'}</label>
                <select 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer" 
                  value={adminUserRole} 
                  onChange={(e) => setAdminUserRole(e.target.value)}
                >
                  <option value="member">MEMBER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <button type="button" className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-2 rounded-lg text-xs text-[#a29bfe] cursor-pointer" onClick={() => setIsAdminUserModalOpen(false)}>
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#6c5ce7] hover:bg-[#5b4bc4] px-4 py-2 rounded-lg text-white text-xs font-bold cursor-pointer">
                  {lang === 'vi' ? 'Lưu lại' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA LIÊN KẾT (ADMIN) */}
      {isAdminLinkModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[450px] p-6 shadow-2xl animate-fade-in text-[#e8e8f0]">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between">
              <span>🔗 {adminEditingLink ? (lang === 'vi' ? 'Sửa thông tin liên kết' : 'Edit Link') : (lang === 'vi' ? 'Thêm liên kết mới' : 'Add New Link')}</span>
              <button className="text-sm font-normal text-[#7a7a9a] hover:text-white" onClick={() => setIsAdminLinkModalOpen(false)}>✕</button>
            </h3>
            <form onSubmit={handleAdminLinkSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Tên liên kết' : 'Link Name'}</label>
                <input 
                  type="text" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminLinkName} 
                  onChange={(e) => setAdminLinkName(e.target.value)} 
                  placeholder={lang === 'vi' ? 'Ví dụ: Chiến dịch hè' : 'e.g. Summer Campaign'} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Liên kết gốc (Destination URL)' : 'Destination URL'}</label>
                <input 
                  required 
                  type="url" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminLinkUrl} 
                  onChange={(e) => setAdminLinkUrl(e.target.value)} 
                  placeholder="https://example.com/very-long-url" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Alias / Shortcode' : 'Shortcode'}</label>
                <input 
                  type="text" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminLinkAlias} 
                  onChange={(e) => setAdminLinkAlias(e.target.value)} 
                  placeholder={lang === 'vi' ? 'Bỏ trống để tự tạo mã' : 'Leave blank to auto-generate'} 
                />
              </div>
              
              {!adminEditingLink && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Email người sở hữu (Bỏ trống = Hệ thống)' : 'Owner Email (Blank = System)'}</label>
                  <input 
                    type="email" 
                    className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                    value={adminLinkOwnerEmail} 
                    onChange={(e) => setAdminLinkOwnerEmail(e.target.value)} 
                    placeholder="user@example.com" 
                  />
                </div>
              )}

              {adminEditingLink && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Trạng thái hoạt động' : 'Status'}</label>
                  <select 
                    className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer" 
                    value={adminLinkStatus} 
                    onChange={(e) => setAdminLinkStatus(e.target.value)}
                  >
                    <option value="active">{lang === 'vi' ? 'Đang chạy (Active)' : 'Active'}</option>
                    <option value="paused">{lang === 'vi' ? 'Tạm dừng (Paused)' : 'Paused'}</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Ngày hết hạn (Không bắt buộc)' : 'Expiration Date (Optional)'}</label>
                <input 
                  type="datetime-local" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none font-mono" 
                  value={adminLinkExpiredAt ? adminLinkExpiredAt.substring(0, 16) : ''} 
                  onChange={(e) => setAdminLinkExpiredAt(e.target.value)} 
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <button type="button" className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-2 rounded-lg text-xs text-[#a29bfe] cursor-pointer" onClick={() => setIsAdminLinkModalOpen(false)}>
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#6c5ce7] hover:bg-[#5b4bc4] px-4 py-2 rounded-lg text-white text-xs font-bold cursor-pointer">
                  {lang === 'vi' ? 'Lưu lại' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA NHÓM (ADMIN) */}
      {isAdminWorkspaceModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[400px] p-6 shadow-2xl animate-fade-in text-[#e8e8f0]">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between">
              <span>👥 {adminEditingWorkspace ? (lang === 'vi' ? 'Sửa thông tin nhóm' : 'Edit Workspace') : (lang === 'vi' ? 'Tạo nhóm mới' : 'Create New Workspace')}</span>
              <button className="text-sm font-normal text-[#7a7a9a] hover:text-white" onClick={() => setIsAdminWorkspaceModalOpen(false)}>✕</button>
            </h3>
            <form onSubmit={handleAdminWorkspaceSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Tên nhóm' : 'Workspace Name'}</label>
                <input 
                  required 
                  type="text" 
                  className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                  value={adminWorkspaceName} 
                  onChange={(e) => setAdminWorkspaceName(e.target.value)} 
                  placeholder={lang === 'vi' ? 'Ví dụ: Phòng Marketing' : 'e.g. Marketing Dept'} 
                />
              </div>
              
              {!adminEditingWorkspace && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">{lang === 'vi' ? 'Email Trưởng nhóm (Owner)' : 'Workspace Owner Email'}</label>
                  <input 
                    required
                    type="email" 
                    className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 text-xs text-white outline-none" 
                    value={adminWorkspaceOwnerEmail} 
                    onChange={(e) => setAdminWorkspaceOwnerEmail(e.target.value)} 
                    placeholder="user@example.com" 
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <button type="button" className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-2 rounded-lg text-xs text-[#a29bfe] cursor-pointer" onClick={() => setIsAdminWorkspaceModalOpen(false)}>
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="bg-[#6c5ce7] hover:bg-[#5b4bc4] px-4 py-2 rounded-lg text-white text-xs font-bold cursor-pointer">
                  {lang === 'vi' ? 'Lưu lại' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO WORKSPACE MỚI */}
      {isWorkspaceCreateOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[400px] p-6">
            <h3 className="text-base font-bold mb-4">👥 {t.createWorkspace}</h3>
            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <input required type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white outline-none" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder={t.workspaceName} />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsWorkspaceCreateOpen(false)}>{t.cancel}</button><button type="submit" className="bg-[#6c5ce7] px-4 py-1.5 rounded-lg text-white text-xs">{t.createWorkspace}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MỜI THÀNH VIÊN */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[400px] p-6">
            <h3 className="text-base font-bold mb-4">✉️ {t.inviteMember}</h3>
            <form onSubmit={handleInviteMember} className="flex flex-col gap-4">
              <input required type="email" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white outline-none" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t.memberEmail} />
              <select className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white outline-none" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="viewer">{lang === 'vi' ? 'Viewer (Chỉ xem)' : 'Viewer (Read-only)'}</option>
                <option value="editor">{lang === 'vi' ? 'Editor (Chỉnh sửa)' : 'Editor (Read/Write)'}</option>
                <option value="owner">{lang === 'vi' ? 'Owner (Quản trị)' : 'Owner (Admin)'}</option>
              </select>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsInviteOpen(false)}>{t.cancel}</button><button type="submit" className="bg-[#6c5ce7] px-4 py-1.5 rounded-lg text-white text-xs">{t.inviteMember}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM THÀNH VIÊN */}
      {isMembersListOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[450px] p-6">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between">
              <span>👥 {t.membersList} - {selectedWorkspaceName}</span>
              <button className="text-sm font-normal text-[#7a7a9a]" onClick={() => setIsMembersListOpen(false)}>✕</button>
            </h3>
            
            <div className="max-h-[300px] overflow-y-auto space-y-3 mb-4 pr-1">
              {workspaceMembers.map((member, idx) => {
                const currentWorkspaceRole = workspaces.find(ws => ws.id === selectedWorkspaceId)?.role;
                const isCurrentUserOwner = currentWorkspaceRole === 'owner';
                const isMemberOwner = member.role_in_workspace === 'owner';
                
                return (
                  <div key={idx} className="flex justify-between items-center bg-[#18181f] p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                    <div className="flex flex-col gap-0.5 truncate max-w-[200px]">
                      <div className="text-xs font-mono text-[#e8e8f0] truncate">
                        {member.email}
                      </div>
                      {isMemberOwner && (
                        <div className="text-[9px] font-bold text-[#ff7675] uppercase">{lang === 'vi' ? '👑 Quản trị viên (Owner)' : '👑 Workspace Owner'}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCurrentUserOwner && !isMemberOwner ? (
                        <>
                          <select 
                            value={member.role_in_workspace} 
                            onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value)}
                            className="bg-[#111118] border border-[rgba(255,255,255,0.1)] rounded px-1.5 py-0.5 text-[10px] text-white outline-none cursor-pointer"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteMember(member.user_id)}
                            className="text-[10px] bg-[rgba(255,118,117,0.15)] hover:bg-[rgba(255,118,117,0.3)] text-[#ff7675] px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {lang === 'vi' ? 'Xóa' : 'Delete'}
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[rgba(108,92,231,0.2)] text-[#a29bfe]">
                          {member.role_in_workspace}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {workspaceMembers.length === 0 && (
                <div className="text-xs italic text-[#7a7a9a] text-center py-4">Chưa có thành viên nào.</div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-1.5 rounded-lg text-xs text-[#a29bfe]" onClick={() => setIsMembersListOpen(false)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM LIÊN KẾT TRONG WORKSPACE */}
      {isWorkspaceLinksOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in text-[#e8e8f0]">
          <div className="bg-[#111118] border border-[rgba(255,255,255,0.12)] rounded-2xl w-[600px] p-6 flex flex-col max-h-[85vh] shadow-2xl">
            <h3 className="text-base font-bold mb-4 flex items-center justify-between shrink-0">
              <span>🔗 {t.workspaceLinksTitle} - {selectedWorkspaceName}</span>
              <button className="text-sm font-normal text-[#7a7a9a] hover:text-white transition-colors cursor-pointer" onClick={() => setIsWorkspaceLinksOpen(false)}>✕</button>
            </h3>

            <div className="overflow-y-auto flex-1 space-y-3 mb-4 pr-1 min-h-[150px]">
              {workspaceLinks.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#18181f] text-[10px] text-[#7a7a9a] uppercase border-b border-[rgba(255,255,255,0.07)]">
                      <th className="p-3">{t.tableShort}</th>
                      <th className="p-3">{lang === 'vi' ? 'Liên kết gốc' : 'Destination URL'}</th>
                      <th className="p-3 text-center">{t.tableClicks}</th>
                      <th className="p-3">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspaceLinks.map((link, idx) => (
                      <tr key={idx} className="border-b border-[rgba(255,255,255,0.04)] text-xs hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="p-3 font-mono text-[#a29bfe]">/{link.short_code}</td>
                        <td className="p-3 max-w-[220px] truncate font-mono text-[#7a7a9a]" title={link.original_url}>{link.original_url}</td>
                        <td className="p-3 text-center font-mono">{link.clicks}</td>
                        <td className="p-3">
                          {link.status === 'active' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(85,239,196,0.15)] text-[#2ed573]">
                              {lang === 'vi' ? 'Đang chạy' : 'Running'}
                            </span>
                          )}
                          {link.status === 'paused' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(253,203,110,0.15)] text-[#eccc68]">
                              {lang === 'vi' ? 'Tạm dừng' : 'Paused'}
                            </span>
                          )}
                          {link.status === 'expired' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(255,118,117,0.15)] text-[#ff4757]">
                              {lang === 'vi' ? 'Kết thúc' : 'Ended'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs italic text-[#7a7a9a] text-center py-12">{t.noWorkspaceLinks}</div>
              )}
            </div>

            <div className="flex justify-end shrink-0 pt-3 border-t border-[rgba(255,255,255,0.05)]">
              <button className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-4 py-1.5 rounded-lg text-xs text-[#a29bfe] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-all" onClick={() => setIsWorkspaceLinksOpen(false)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
