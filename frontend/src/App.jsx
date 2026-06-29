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
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
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

  const [longUrl, setLongUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [linkParams, setLinkParams] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
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
      systemTitle: 'Danh sách liên kết rút gọn',
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
      switchLanguage: 'Chuyển ngôn ngữ',
      workspaces: 'Workspaces (Nhóm)',
      createWorkspace: 'Tạo Team mới',
      workspaceName: 'Tên Team',
      inviteMember: 'Mời thành viên',
      memberEmail: 'Email người cần mời',
      viewMembers: 'Xem thành viên',
      membersList: 'Danh sách thành viên'
    },
    en: {
      brand: 'SLinkTrack',
      primaryTitle: 'Shortlink helps you track and analyze user data',
      usernameOrEmail: 'Email address',
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
      backToDashboard: 'Back to dashboard',
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
      membersList: 'Members list'
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
    if (token) {
      if (savedUser) setUsername(savedUser);
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
          expired_at: expiredAt ? new Date(expiredAt).toISOString() : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', '✨ Thành công', data.message || 'Tạo liên kết rút gọn thành công!');
        setCreatedShortUrl(data.short_url || `${API_URL}/${data.short_code}`);
        setSelectedShortCode(data.short_code);
        setIsSuccessOpen(true);
        setIsCreateOpen(false);
        setLongUrl(''); setLinkName(''); setCustomAlias(''); setCustomDomain(''); setLinkParams(''); setExpiredAt('');
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
        <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6 md:p-16 relative bg-[#0a0a0f] overflow-y-auto">
          
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

          {/* CỘT TRÁI: LOGO & SLOGAN */}
          <div className="w-full max-w-[400px] text-center lg:text-left flex flex-col justify-center select-none shrink-0">
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-[#6c5ce7] mb-4">
              SLink<span className="text-[#a29bfe]">Track</span>
            </h1>
            <h2 className="text-sm lg:text-lg font-medium text-[#e8e8f0] leading-relaxed">
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
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-2xl font-extrabold text-[#e8e8f0] whitespace-nowrap shrink-0">{t.forgotTitle}</div>
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
              <div className="text-2xl font-extrabold text-[#e8e8f0] whitespace-nowrap shrink-0">{t.resetTitle}</div>
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
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
              <div className="rounded-xl bg-[#14141c] border border-[rgba(255,255,255,0.06)] p-4 text-[11px] text-[#7a7a9a]">
                {lang === 'vi' 
                  ? `Mã OTP đã được gửi đến email ${resetEmail}. Mã có hiệu lực trong 5 phút.` 
                  : `OTP code sent to email ${resetEmail}. Valid for 5 minutes.`}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">Mã OTP (6 chữ số)</label>
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
            <div className="text-center text-xs text-[#7a7a9a] mt-5"><button className="text-[#a29bfe] cursor-pointer hover:underline" onClick={() => setCurrentScreen('login')}>{t.backToLogin}</button></div>
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
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${currentScreen === 'dashboard' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('dashboard')}>📊 Dashboard</div>
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'workspaces' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('workspaces')}>👥 {t.workspaces}</div>
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
                  <option value="personal">Cá nhân (Personal)</option>
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
                    <div className="text-xs font-bold text-[#a29bfe] uppercase">📊 Thống kê lượt click</div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Lọc theo Link */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">Chọn link:</label>
                        <select className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-[11px] text-white outline-none" value={filterLinkCode} onChange={(e) => setFilterLinkCode(e.target.value)}>
                          <option value="all">Tất cả link</option>
                          {links.map((link, idx) => (
                            <option key={idx} value={link.short_code}>/{link.short_code} ({link.name || 'Không tên'})</option>
                          ))}
                        </select>
                      </div>

                      {/* Lọc theo thời gian */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-[#7a7a9a] uppercase">Thời gian:</label>
                        <select className="bg-[#18181f] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-[11px] text-white outline-none" value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                          <option value="today">Hôm nay</option>
                          <option value="7days">7 ngày trước</option>
                          <option value="30days">30 ngày trước</option>
                          <option value="custom">Tùy chỉnh</option>
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
              <input required type="url" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder={t.longUrlPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder={t.linkNameLabel} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} placeholder={t.customAliasPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder={t.domainPlaceholder} />
              <input type="text" className="bg-[#18181f] border border-[rgba(255,255,255,0.07)] rounded-lg p-2 text-xs text-white font-mono outline-none" value={linkParams} onChange={(e) => setLinkParams(e.target.value)} placeholder={t.paramsPlaceholder} />
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
                <option value="">-- Cá nhân (Không gian mặc định) --</option>
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
            <div className="text-xs font-mono bg-[#18181f] py-1 px-3 border border-[rgba(255,255,255,0.05)] rounded">localhost:8000/{selectedShortCode}</div>
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

      {currentScreen === 'workspaces' && (
        <div className="flex w-full min-h-screen text-[#e8e8f0]">
          <aside className="w-[220px] bg-[#111118] border-r border-[rgba(255,255,255,0.07)] flex flex-col py-6 fixed top-0 left-0 bottom-0">
            <div className="px-5 pb-7 flex items-center gap-2.5">
              <div className="text-xl font-extrabold text-[#e8e8f0]">SLink<span className="text-[#a29bfe]">Track</span></div>
            </div>
            <div className="px-3 mb-1 flex-1">
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${currentScreen === 'dashboard' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('dashboard')}>📊 Dashboard</div>
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer mt-1 ${currentScreen === 'workspaces' ? 'bg-[rgba(108,92,231,0.15)] text-[#a29bfe]' : 'text-[#7a7a9a] hover:bg-[#18181f]'}`} onClick={() => setCurrentScreen('workspaces')}>👥 {t.workspaces}</div>
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
                    <div className="flex gap-2">
                      <button className="text-xs bg-[#18181f] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg text-[#a29bfe] cursor-pointer" onClick={() => { setSelectedWorkspaceId(ws.id); setSelectedWorkspaceName(ws.name); fetchWorkspaceMembers(ws.id); setIsMembersListOpen(true); }}>
                        {t.viewMembers}
                      </button>
                      {ws.role === 'owner' && (
                        <button className="text-xs bg-[#6c5ce7] border border-transparent px-3 py-1.5 rounded-lg text-white cursor-pointer" onClick={() => { setSelectedWorkspaceId(ws.id); setIsInviteOpen(true); }}>
                          {t.inviteMember}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {workspaces.length === 0 && (
                  <div className="col-span-3 text-sm text-[#7a7a9a] italic">Bạn chưa tham gia không gian làm việc nào.</div>
                )}
              </div>
            </div>
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
                <option value="viewer">Viewer (Chỉ xem)</option>
                <option value="editor">Editor (Chỉnh sửa)</option>
                <option value="owner">Owner (Quản trị)</option>
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
                        <div className="text-[9px] font-bold text-[#ff7675] uppercase">👑 Quản trị viên (Owner)</div>
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

    </div>
  );
}
