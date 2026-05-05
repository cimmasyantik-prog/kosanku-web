import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BedDouble, Users, WalletCards, Settings, Bell, Search, Plus, 
  MoreVertical, CheckCircle2, XCircle, AlertCircle, Menu, X, Phone, 
  Calendar, MapPin, ChevronDown, Download, MessageCircle, Upload, Clock, 
  Building, LogOut, AlertTriangle, User, Trash2, Printer, Edit, FileText, 
  Wifi, ShieldCheck, Car, Star, ArrowRight, Loader2, RefreshCw, Info, Image as ImageIcon
} from 'lucide-react';

// --- HELPER FORMATTER ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const getCurrentMonthYear = () => { const d = new Date(); return `${d.toLocaleString('id-ID', { month: 'long' })} ${d.getFullYear()}`; };

// --- KONFIGURASI API GOOGLE SHEETS ---
// GANTI TULISAN DI BAWAH INI DENGAN URL GOOGLE APPS SCRIPT ANDA
const RAW_API_URL = 'https://script.google.com/macros/s/AKfycbwUZFTxqQeypsMJttHJjKXk3yghaGcilXt2JwHugZjU6bRvKTaHsYaBh0w79E35Aokk/exec'; 

const API_URL = RAW_API_URL + (RAW_API_URL.includes('?') ? '&' : '?');

// --- DATA SIMULASI (JIKA OFFLINE/GAGAL KONEKSI) ---
const SIMULATION_DATA = {
  properties: [{ id: 'p1', name: 'Kosanku Anggrek', address: 'Jl. Anggrek No. 12', manager: 'Budi' }],
  rooms: [{ id: 1, propertyId: 'p1', number: '101', type: 'Standard', price: 1500000, status: 'occupied', tenantId: 101, facilities: ['AC', 'Kasur', 'Lemari', 'Kamar Mandi Dalam'] }],
  tenants: [{ id: 101, propertyId: 'p1', name: 'Budi Santoso', phone: '081234567890', emergencyContact: '081298765432', joinDate: '2026-01-01', roomId: 1 }],
  transactions: [{ id: 1001, propertyId: 'p1', tenantId: 101, roomId: 1, amount: 1500000, month: getCurrentMonthYear(), status: 'unpaid', dueDate: '2026-04-10', date: '', type: 'transfer', proofUrl: '' }],
  admins: [{ username: 'admin', password: 'admin123' }],
  notifications: [],
  settings: []
};

// PENGATURAN DEFAULT TAMPILAN AWAL
const DEFAULT_SETTINGS = {
  appName: 'Kosanku',
  appLogo: '',
  heroImg: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
  gallery1: 'https://images.unsplash.com/photo-1502672260266-1c1c24240f57?auto=format&fit=crop&w=800&q=80',
  gallery2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  gallery3: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  mapImg: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
  fac1Title: 'Kamar Full Furnished', fac1Desc: 'Kasur empuk, lemari, meja belajar, dan AC di setiap unit.',
  fac2Title: 'Wi-Fi Kecepatan Tinggi', fac2Desc: 'Akses internet stabil 24/7 untuk mendukung aktivitas Anda.',
  fac3Title: 'Keamanan CCTV 24 Jam', fac3Desc: 'Pantauan keamanan penuh dan akses sidik jari/kartu.',
  fac4Title: 'Area Parkir Luas', fac4Desc: 'Tersedia parkir motor dan mobil yang aman di dalam area kos.'
};

// --- KOMPONEN TERPISAH (Agar tidak unmount saat App re-render) ---
const SidebarItem = ({ icon: Icon, label, viewId, currentView, setCurrentView, setIsSidebarOpen }) => (
  <button onClick={() => { setCurrentView(viewId); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === viewId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
    <Icon size={20} className={currentView === viewId ? 'text-indigo-100' : 'text-gray-400'} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const AdminSettings = ({ allAdmins, siteSettings, sendDataToSheets, showMessage, setAllAdmins, setSiteSettings }) => {
  const currentAdmin = allAdmins[0] || { username: 'admin', password: 'admin123' };
  const [formData, setFormData] = useState({ username: currentAdmin.username, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [displayForm, setDisplayForm] = useState(siteSettings);

  useEffect(() => {
    setDisplayForm(siteSettings);
  }, [siteSettings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (formData.currentPassword !== currentAdmin.password) return showMessage('Gagal', 'Kata sandi saat ini salah!', 'error');
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) return showMessage('Gagal', 'Kata sandi baru dan konfirmasi tidak cocok!', 'error');
    
    const newCreds = { username: formData.username, password: formData.newPassword || currentAdmin.password };
    setAllAdmins([newCreds]); sendDataToSheets('editAdmin', newCreds);
    setFormData({ username: newCreds.username, currentPassword: '', newPassword: '', confirmPassword: '' });
    showMessage('Berhasil', 'Pengaturan akun berhasil diperbarui di Google Sheets!', 'info');
  };

  const handleSaveDisplay = (e) => {
    e.preventDefault();
    setSiteSettings(displayForm);
    const payloadArray = Object.keys(displayForm).map(k => ({ key: k, value: displayForm[k] }));
    sendDataToSheets('saveSettings', payloadArray);
    showMessage('Berhasil', 'Tampilan Landing Page berhasil diperbarui dan tersimpan!', 'info');
  };

  const handleImageUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        const MAX_WIDTH = 500; 
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        if (compressedBase64.length > 50000) return showMessage('Ukuran Terlalu Besar', 'Foto masih melebihi batas. Silakan gunakan resolusi lebih kecil.', 'error');
        setDisplayForm(prev => ({ ...prev, [key]: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const ImageUploadField = ({ label, settingKey, isLogo = false }) => {
    const currentVal = displayForm[settingKey] || '';
    const isBase64 = currentVal.startsWith('data:image/');

    return (
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 block">{label}</label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`${isLogo ? 'w-16 h-16 rounded-2xl' : 'w-24 h-16 rounded-xl'} border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 relative group flex items-center justify-center`}>
            {currentVal ? <img src={currentVal} alt="preview" className="w-full h-full object-cover" /> : <div className="text-gray-400"><ImageIcon size={isLogo ? 24 : 20}/></div>}
          </div>
          <div className="flex-1 w-full space-y-2">
            <div className="flex gap-2 w-full">
              <input 
                type="text" 
                placeholder={isBase64 ? "Gambar dari file (Ketik URL untuk mengganti)..." : "Tempel link URL gambar di sini..."} 
                value={isBase64 ? '' : currentVal}
                onChange={(e) => setDisplayForm(prev => ({ ...prev, [settingKey]: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
              />
              <div className="relative flex-shrink-0">
                <input type="file" id={`upload-${settingKey}`} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, settingKey)} />
                <label htmlFor={`upload-${settingKey}`} className="cursor-pointer bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition h-full flex items-center justify-center">
                  <Upload size={14} className="mr-1.5" /> Upload File
                </label>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Pilih salah satu: Tempel link URL gambar <span className="font-bold">ATAU</span> upload file dari perangkat.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-10">
      <div><h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pengaturan Akun</h2></div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 p-6 sm:p-8">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div><label className="text-sm font-bold text-gray-700 block mb-2">Username Admin</label><input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500"/></div>
          <div className="border-t border-gray-100 pt-6 mt-6"><label className="text-sm font-bold text-gray-700 block mb-2">Kata Sandi Saat Ini <span className="text-red-500">*</span></label><input type="password" required value={formData.currentPassword} onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} placeholder="Sandi saat ini..." className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 mb-2"/></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className="text-sm font-bold text-gray-700 block mb-2">Sandi Baru</label><input type="password" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500"/></div>
            <div><label className="text-sm font-bold text-gray-700 block mb-2">Konfirmasi</label><input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500"/></div>
          </div>
          <div className="pt-6 flex justify-end"><button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-indigo-200/50">Simpan Perubahan</button></div>
        </form>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200"><h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pengaturan Super Apps</h2></div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 p-6 sm:p-8">
        <form onSubmit={handleSaveDisplay} className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Identitas Utama</h3>
            <div className="space-y-6">
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Aplikasi</label><input type="text" value={displayForm.appName || ''} onChange={(e) => setDisplayForm({...displayForm, appName: e.target.value})} placeholder="Kosanku" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" /></div>
              <ImageUploadField label="Logo Aplikasi" settingKey="appLogo" isLogo={true} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Foto Banner & Peta Lokasi</h3>
            <div className="space-y-6"><ImageUploadField label="Foto Utama (Banner Atas)" settingKey="heroImg" /><ImageUploadField label="Foto Peta Lokasi (Bawah)" settingKey="mapImg" /></div>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Foto Galeri Kos</h3>
            <div className="space-y-6"><ImageUploadField label="Foto Galeri 1" settingKey="gallery1" /><ImageUploadField label="Foto Galeri 2" settingKey="gallery2" /><ImageUploadField label="Foto Galeri 3" settingKey="gallery3" /></div>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-indigo-600 mb-3 uppercase tracking-wider">Teks Fasilitas Unggulan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(n => (
                <div key={n} className="bg-gray-50 p-4 rounded-2xl">
                  <input type="text" value={displayForm[`fac${n}Title`]} onChange={(e) => setDisplayForm({...displayForm, [`fac${n}Title`]: e.target.value})} className="w-full font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
                  <textarea value={displayForm[`fac${n}Desc`]} onChange={(e) => setDisplayForm({...displayForm, [`fac${n}Desc`]: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none" rows="2"></textarea>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 flex justify-end"><button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-indigo-200/50">Simpan Tampilan Web</button></div>
        </form>
      </div>
    </div>
  );
};


// === KOMPONEN UTAMA ===
export default function App() {
  const lastWriteTime = useRef(0);

  // Data States
  const [properties, setProperties] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]); 
  const [notifications, setNotifications] = useState([]);
  const [tenantNotifs, setTenantNotifs] = useState([]); 
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  
  // Status & Loaders
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  // Auth & Navigasi
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [userRole, setUserRole] = useState(null); 
  const [loginRole, setLoginRole] = useState('tenant'); 
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginPropertyId, setLoginPropertyId] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // UI States
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [messageBox, setMessageBox] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [financeFilter, setFinanceFilter] = useState('all');
  const [tenantSearch, setTenantSearch] = useState('');

  // Modals
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [editPropertyModalOpen, setEditPropertyModalOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, tenantId: null, roomId: null, tenantName: '' });
  const [deleteRoomModal, setDeleteRoomModal] = useState({ isOpen: false, roomId: null, isOccupied: false });
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, data: null });
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadModal, setUploadModal] = useState({ isOpen: false, transactionId: null });
  const [proofModal, setProofModal] = useState({ isOpen: false, imageUrl: null });
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waNameInput, setWaNameInput] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  // Forms
  const [newTenantData, setNewTenantData] = useState({ name: '', phone: '', emergencyContact: '', roomId: '' });
  const [newRoomData, setNewRoomData] = useState({ number: '', type: 'Standard', price: '' });
  const [newPropertyData, setNewPropertyData] = useState({ name: '', address: '', manager: '' });
  const [editRoomData, setEditRoomData] = useState({ id: null, number: '', type: '', price: '', status: '' });
  const [editPropertyData, setEditPropertyData] = useState({ id: null, name: '', address: '' });

  // Computed Data
  const rooms = allRooms.filter(r => String(r.propertyId) === String(selectedPropertyId));
  const tenants = allTenants.filter(t => String(t.propertyId) === String(selectedPropertyId));
  const transactions = allTransactions.filter(t => String(t.propertyId) === String(selectedPropertyId));
  const selectedPropertyDetails = properties.find(p => String(p.id) === String(selectedPropertyId));

  const isOwner = userRole === 'owner';
  const isTenant = userRole === 'tenant';
  
  const myTenantProfile = isTenant ? allTenants.find(t => String(t.name).toLowerCase() === String(usernameInput).toLowerCase()) : null;
  const myRoom = isTenant ? allRooms.find(r => String(r.id) === String(myTenantProfile?.roomId)) : null;
  const myTransactions = isTenant ? allTransactions.filter(t => String(t.tenantId) === String(myTenantProfile?.id)) : [];

  // --- LOGIKA PENGINGAT TAGIHAN OTOMATIS (1 JAM SEKALI) ---
  const myTransactionsRef = useRef(myTransactions);
  useEffect(() => {
    myTransactionsRef.current = myTransactions;
  }, [myTransactions]);

  useEffect(() => {
    let intervalId;
    if (userRole === 'tenant') {
      const checkAndNotify = () => {
        const hasUnpaid = myTransactionsRef.current.some(t => String(t.status) === 'unpaid');
        if (hasUnpaid) {
          setTenantNotifs(prev => {
            // Mencegah notifikasi berulang jika notifikasi sebelumnya belum dibaca
            if (prev.some(n => String(n.title) === 'Pengingat Pembayaran' && (!n.isRead || String(n.isRead).toLowerCase() === 'false'))) {
              return prev;
            }
            return [{
              id: Date.now() + Math.random(),
              type: 'warning',
              title: 'Pengingat Pembayaran',
              message: 'Anda memiliki tagihan kos yang belum lunas. Mohon segera diselesaikan.',
              isRead: false,
              time: new Date().toLocaleString('id-ID')
            }, ...prev];
          });
        }
      };

      setTimeout(checkAndNotify, 1500); 
      intervalId = setInterval(checkAndNotify, 3600000); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userRole]);

  const showMessage = (title, message, type = 'info') => {
    setMessageBox({ isOpen: true, title, message, type });
  };

  const addNotification = (type, title, message) => {
    const newNotif = { id: Date.now(), type, title, message, isRead: false, time: new Date().toLocaleString('id-ID') };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const loadSimulationData = () => {
    setProperties(SIMULATION_DATA.properties);
    setAllRooms(SIMULATION_DATA.rooms);
    setAllTenants(SIMULATION_DATA.tenants);
    setAllTransactions(SIMULATION_DATA.transactions);
    setAllAdmins(SIMULATION_DATA.admins);
    setSiteSettings(DEFAULT_SETTINGS);
    setSelectedPropertyId('p1');
    setLoginPropertyId('p1');
  };

  // --- FETCH DATA DARI GOOGLE SHEETS ---
  const fetchGoogleSheetsData = async (showFullLoading = false, isManualSync = false) => {
    if (Date.now() - lastWriteTime.current < 3000 && !isManualSync) return;
    
    if (showFullLoading) setIsLoadingData(true);
    if (isManualSync) setIsSyncing(true);

    if (!RAW_API_URL || !RAW_API_URL.startsWith('http')) {
      setIsSimulationMode(true);
      setFetchError('Menjalankan Mode Simulasi. URL API Google Sheets belum diatur.');
      loadSimulationData();
      setIsLoadingData(false);
      setIsSyncing(false);
      return;
    }
    
    try {
      const response = await fetch(RAW_API_URL);
      if (!response.ok) throw new Error('Gagal merespons dari server Google.');
      const data = await response.json();
      
      const formatArray = (str) => typeof str === 'string' && str ? str.split('|') : [];
      const formattedRooms = (data.rooms || []).map(r => ({ ...r, facilities: formatArray(r.facilities) }));
      const formattedTransactions = (data.transactions || []).map(t => ({ ...t, amount: Number(t.amount) || 0 }));
      const formattedTenants = data.tenants || [];

      setProperties(data.properties || []);
      setAllRooms(formattedRooms);
      setAllTenants(formattedTenants);
      setAllTransactions(formattedTransactions);
      setAllAdmins(data.admins || [{ username: 'admin', password: 'admin123' }]);
      setNotifications((data.notifications || []).reverse());

      const fetchedSettings = data.settings || [];
      const settingsMap = { ...DEFAULT_SETTINGS };
      fetchedSettings.forEach(s => { if (s.key && s.value) settingsMap[s.key] = s.value; });
      setSiteSettings(settingsMap);

      localStorage.setItem('kosanku_db_cache', JSON.stringify({
        properties: data.properties || [], rooms: formattedRooms, tenants: formattedTenants, 
        transactions: formattedTransactions, admins: data.admins || [{ username: 'admin', password: 'admin123' }],
        settings: fetchedSettings
      }));

      if (showFullLoading && data.properties && data.properties.length > 0) {
        setSelectedPropertyId(data.properties[0].id);
        setLoginPropertyId(data.properties[0].id);
      }
      setIsSimulationMode(false);
      setFetchError('');
      if (isManualSync) addNotification('success', 'Sinkronisasi Selesai', 'Data berhasil diperbarui dari server.');
    } catch (error) {
      console.warn("Fetch Error Handled:", error);
      setIsSimulationMode(true);
      setFetchError('Gagal terhubung ke Google Sheets. Memuat data cache/simulasi.');
      
      const cachedData = localStorage.getItem('kosanku_db_cache');
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          setProperties(data.properties || []);
          setAllRooms(data.rooms || []);
          setAllTenants(data.tenants || []);
          setAllTransactions(data.transactions || []);
          setAllAdmins(data.admins || [{ username: 'admin', password: 'admin123' }]);
          if (data.settings) {
            const sm = { ...DEFAULT_SETTINGS };
            data.settings.forEach(s => { if (s.key && s.value) sm[s.key] = s.value; });
            setSiteSettings(sm);
          }
          if (data.properties && data.properties.length > 0) {
            setSelectedPropertyId(data.properties[0].id);
            setLoginPropertyId(data.properties[0].id);
          }
        } catch (e) { loadSimulationData(); }
      } else { loadSimulationData(); }
    } finally {
      setIsLoadingData(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => { fetchGoogleSheetsData(true); }, []);

  const sendDataToSheets = async (action, payload) => {
    setIsSaving(true);
    lastWriteTime.current = Date.now();

    if (!RAW_API_URL || !RAW_API_URL.startsWith('http')) {
      console.warn('Mode simulasi: Data tidak dikirim ke server.');
      setIsSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('data', JSON.stringify(payload));
      
      await fetch(API_URL, { method: 'POST', body: formData });
    } catch (error) {
      console.error("Gagal menyimpan data ke Sheets:", error);
      showMessage('Koneksi Gagal', 'Data hanya tersimpan sementara di perangkat ini karena gagal terhubung ke server.', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // --- FUNGSI HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      if (loginRole === 'owner') {
        const adminCreds = allAdmins[0] || { username: 'admin', password: 'admin123' };
        if (String(usernameInput) === String(adminCreds.username) && String(passwordInput) === String(adminCreds.password)) {
          setUserRole('owner'); setShowLandingPage(false); setCurrentView('dashboard'); setPasswordInput('');
        } else { setLoginError('Username atau kata sandi pengelola salah.'); }
      } else {
        const tenant = allTenants.find(t => String(t.name).toLowerCase() === String(usernameInput).toLowerCase() && String(t.propertyId) === String(loginPropertyId));
        if (tenant) {
          const room = allRooms.find(r => String(r.id) === String(tenant.roomId));
          const cleanPasswordInput = String(passwordInput).replace(/^0+/, '');
          const cleanRoomNumber = room ? String(room.number).replace(/^0+/, '') : '';
          
          if (room && cleanPasswordInput === cleanRoomNumber) {
            setUserRole('tenant'); setShowLandingPage(false); setCurrentView('dashboard'); setPasswordInput('');
          } else { setLoginError('Kata sandi (nomor kamar) salah untuk penyewa ini.'); }
        } else { setLoginError('Nama penyewa tidak terdaftar di area ini.'); }
      }
    } catch (error) {
      console.error("Login Error:", error);
      setLoginError('Terjadi kesalahan sistem saat memproses data.');
    }
  };

  const handleLogout = () => { 
    setUserRole(null); setShowLandingPage(true); setUsernameInput(''); setPasswordInput(''); setTenantNotifs([]); 
  };
  
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect; const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleAddTenant = (e) => {
    e.preventDefault();
    const room = rooms.find(r => String(r.id) === String(newTenantData.roomId));
    if (!room) return showMessage('Gagal', 'Silakan pilih kamar yang valid.', 'error');

    const newTenantId = Date.now();
    const newTenant = { id: newTenantId, propertyId: selectedPropertyId, name: newTenantData.name, phone: newTenantData.phone, emergencyContact: newTenantData.emergencyContact, joinDate: new Date().toISOString().split('T')[0], roomId: room.id };
    const firstBill = { id: Date.now() + 1, propertyId: selectedPropertyId, tenantId: newTenantId, roomId: room.id, amount: room.price, month: getCurrentMonthYear(), status: 'unpaid', dueDate: '', date: '', type: 'transfer', proofUrl: '' };

    setAllTenants([...allTenants, newTenant]);
    setAllRooms(allRooms.map(r => String(r.id) === String(room.id) ? { ...r, status: 'occupied', tenantId: newTenantId } : r));
    setAllTransactions([...allTransactions, firstBill]);
    
    sendDataToSheets('addTenant', { tenant: newTenant, transaction: firstBill });
    addNotification('success', 'Penghuni Ditambahkan', `${newTenant.name} telah masuk ke Kamar ${room.number}`);
    setIsAddTenantModalOpen(false);
    setNewTenantData({ name: '', phone: '', emergencyContact: '', roomId: '' });
    showMessage('Berhasil', 'Penghuni baru berhasil ditambahkan dan tagihan bulan ini telah dibuat.', 'info');
  };

  const handleCheckoutTenant = (tenantId, roomId, tenantName) => { setCheckoutModal({ isOpen: true, tenantId, roomId, tenantName }); };
  const confirmCheckoutTenant = () => {
    const { tenantId, roomId, tenantName } = checkoutModal;
    setAllTenants(allTenants.filter(t => String(t.id) !== String(tenantId)));
    if (roomId) setAllRooms(allRooms.map(r => String(r.id) === String(roomId) ? { ...r, status: 'available', tenantId: null } : r));
    sendDataToSheets('checkoutTenant', { tenantId, roomId });
    addNotification('warning', 'Penghuni Checkout', `${tenantName} telah dikeluarkan dari kos.`);
    setCheckoutModal({ isOpen: false, tenantId: null, roomId: null, tenantName: '' });
    showMessage('Berhasil', 'Penghuni berhasil dikeluarkan dari sistem.', 'info');
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (rooms.some(r => String(r.number).toLowerCase() === String(newRoomData.number).toLowerCase())) return showMessage('Gagal', `Kamar nomor ${newRoomData.number} sudah ada!`, 'error');
    
    const newRoom = { id: Date.now(), propertyId: selectedPropertyId, number: newRoomData.number, type: newRoomData.type, price: Number(newRoomData.price), status: 'available', tenantId: null, facilities: newRoomData.type === 'VIP' ? ['AC', 'Kamar Mandi Dalam', 'TV', 'Kulkas Mini'] : ['AC', 'Kamar Mandi Dalam'] };
    setAllRooms([...allRooms, newRoom]);
    sendDataToSheets('addRoom', newRoom);
    addNotification('info', 'Unit Baru', `Kamar ${newRoom.number} (${newRoom.type}) ditambahkan.`);
    setIsAddRoomModalOpen(false);
    setNewRoomData({ number: '', type: 'Standard', price: '' });
  };

  const openEditRoomModal = (room) => { setEditRoomData({ ...room }); setIsEditRoomModalOpen(true); };
  const handleSaveRoomEdit = (e) => {
    e.preventDefault();
    const duplicate = rooms.find(r => String(r.number).toLowerCase() === String(editRoomData.number).toLowerCase() && String(r.id) !== String(editRoomData.id));
    if (duplicate) return showMessage('Gagal', `Kamar nomor ${editRoomData.number} sudah dipakai unit lain!`, 'error');

    let updatedRoom = { ...editRoomData, price: Number(editRoomData.price) };
    if (updatedRoom.status === 'available') { updatedRoom.tenantId = null; }

    setAllRooms(allRooms.map(r => String(r.id) === String(updatedRoom.id) ? updatedRoom : r));
    sendDataToSheets('editRoom', updatedRoom);
    setIsEditRoomModalOpen(false);
    showMessage('Berhasil', `Data Kamar ${updatedRoom.number} berhasil diperbarui.`, 'info');
  };

  const handleDeleteRoom = (roomId) => {
    const room = rooms.find(r => String(r.id) === String(roomId));
    if (!room) return;
    setDeleteRoomModal({ isOpen: true, roomId, isOccupied: room.status === 'occupied' });
  };

  const confirmDeleteRoom = () => {
    const { roomId } = deleteRoomModal;
    setAllRooms(allRooms.filter(r => String(r.id) !== String(roomId)));
    sendDataToSheets('deleteRoom', { id: roomId });
    setDeleteRoomModal({ isOpen: false, roomId: null, isOccupied: false });
    showMessage('Dihapus', 'Unit kamar berhasil dihapus secara permanen.', 'info');
  };

  const handleAddProperty = (e) => {
    e.preventDefault();
    const newProp = { id: 'p' + Date.now(), name: newPropertyData.name, address: newPropertyData.address, manager: newPropertyData.manager };
    setProperties([...properties, newProp]);
    sendDataToSheets('addProperty', newProp);
    setIsAddPropertyModalOpen(false);
    setNewPropertyData({ name: '', address: '', manager: '' });
    setSelectedPropertyId(newProp.id);
    showMessage('Berhasil', `Area ${newProp.name} berhasil ditambahkan!`, 'info');
  };

  const openEditPropertyModal = () => {
    if(!selectedPropertyDetails) return;
    setEditPropertyData({ id: selectedPropertyDetails.id, name: selectedPropertyDetails.name, address: selectedPropertyDetails.address });
    setEditPropertyModalOpen(true);
  };

  const handleSavePropertyEdit = (e) => {
    e.preventDefault();
    setProperties(properties.map(p => String(p.id) === String(editPropertyData.id) ? { ...p, name: editPropertyData.name, address: editPropertyData.address } : p));
    sendDataToSheets('editProperty', editPropertyData);
    setEditPropertyModalOpen(false);
    showMessage('Berhasil', 'Informasi area berhasil diperbarui.', 'info');
  };

  const handleConfirmPayment = (transactionId) => {
    const dateStr = new Date().toLocaleString('id-ID');
    setAllTransactions(allTransactions.map(t => String(t.id) === String(transactionId) ? { ...t, status: 'paid', date: dateStr } : t));
    sendDataToSheets('confirmPayment', { transactionId, date: dateStr });
    addNotification('success', 'Pembayaran Dikonfirmasi', `INV-${transactionId} telah lunas.`);
    showMessage('Lunas', 'Pembayaran berhasil dikonfirmasi dan struk telah diterbitkan.', 'info');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setUploadPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleTenantUpload = () => {
    if (!uploadPreview) return showMessage('Peringatan', 'Silakan unggah foto bukti terlebih dahulu.', 'warning');
    const txId = uploadModal.transactionId;
    
    setAllTransactions(allTransactions.map(t => String(t.id) === String(txId) ? { ...t, status: 'pending', proofUrl: uploadPreview } : t));
    sendDataToSheets('uploadProof', { transactionId: txId, proofUrl: uploadPreview });

    if (isTenant) {
      const newNotif = { id: Date.now(), propertyId: myRoom?.propertyId || selectedPropertyId, type: 'info', title: `Bukti Transfer Baru`, message: `${myTenantProfile?.name} (Kamar ${myRoom?.number}) mengunggah bukti INV-${txId}.`, isRead: false, time: new Date().toLocaleString('id-ID') };
      sendDataToSheets('addNotification', newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      showMessage('Berhasil', 'Bukti berhasil diunggah! Menunggu verifikasi pemilik.', 'info');
    }
    setUploadModal({ isOpen: false, transactionId: null });
    setUploadPreview(null);
  };

  const handleReportIssue = (e) => {
    e.preventDefault();
    if(!reportText.trim()) return;
    const newNotif = { id: Date.now(), propertyId: myRoom?.propertyId || selectedPropertyId, type: 'warning', title: `🚨 Laporan Kendala: Kamar ${myRoom?.number}`, message: `${myTenantProfile?.name}: "${reportText}"`, isRead: false, time: new Date().toLocaleString('id-ID') };
    sendDataToSheets('addNotification', newNotif);
    setNotifications(prev => [newNotif, ...prev]);
    setReportText(''); setReportModalOpen(false);
    showMessage('Berhasil', 'Kendala Anda telah dikirim ke Pemilik Kos.', 'info');
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if(!broadcastText.trim()) return;
    const newNotif = { id: Date.now(), propertyId: 'all', type: 'broadcast', title: `📢 Pengumuman Pengelola`, message: broadcastText, isRead: false, time: new Date().toLocaleString('id-ID') };
    sendDataToSheets('addNotification', newNotif);
    setNotifications(prev => [newNotif, ...prev]);
    setBroadcastText(''); setIsBroadcastModalOpen(false);
    showMessage('Berhasil', 'Pengumuman telah dikirim ke semua penghuni.', 'info');
  };

  const handleSendWaInquiry = (e) => {
    e.preventDefault();
    if (!waNameInput.trim()) return;
    const text = `Halo saya ${waNameInput}, saya sedang mencari kos.`;
    window.open(`https://wa.me/6285341503151?text=${encodeURIComponent(text)}`, '_blank');
    setIsWaModalOpen(false); setWaNameInput('');
  };

  const handleSendWA = (tenant, room, trx) => {
    if (!tenant?.phone) return showMessage('Gagal', 'Nomor HP penghuni tidak valid.', 'error');
    const phone = String(tenant.phone).startsWith('0') ? '62' + String(tenant.phone).slice(1) : String(tenant.phone);
    const text = `Halo ${tenant.name}, ini pengingat tagihan kos Kamar ${room?.number} untuk bulan ${trx.month} sebesar ${formatRupiah(trx.amount)}. Mohon segera diselesaikan. Terima kasih.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadCSV = () => {
    const trxToExport = isOwner ? allTransactions.filter(t => financeFilter === 'all' || t.status === financeFilter) : myTransactions.filter(t => financeFilter === 'all' || t.status === financeFilter);
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Area Kos,Invoice ID,Penghuni,Kamar,Bulan,Jumlah,Status\n"
      + trxToExport.map(t => {
        const tenant = allTenants.find(tn => String(tn.id) === String(t.tenantId));
        const room = allRooms.find(r => String(r.id) === String(t.roomId));
        const property = properties.find(p => String(p.id) === String(t.propertyId));
        return `${property ? property.name : '-'},INV-${t.id},${tenant ? tenant.name : '-'},${room ? room.number : '-'},${t.month},${t.amount},${t.status}`;
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_${isOwner ? 'Semua_Area' : 'Tagihanku'}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const handlePrintReceipt = (trx) => { setReceiptModal({ isOpen: true, data: trx }); };
  
  const executePrint = () => {
    if (window.self !== window.top) {
      showMessage('Fitur Diblokir', 'Fungsi cetak (Print) diblokir oleh browser karena Anda sedang berada di layar Preview. Silakan Build & Upload aplikasi ini ke Netlify agar Anda bisa mencetak struk secara nyata.', 'warning');
      return;
    }
    try {
      window.print();
    } catch (e) {
      showMessage('Error Pencetakan', 'Gagal memanggil fungsi cetak browser.', 'error');
    }
  };

  // --- STATS COMPUTATION ---
  const stats = {
    totalTenants: tenants.length,
    occupiedRooms: rooms.filter(r => String(r.status) === 'occupied').length,
    totalRooms: rooms.length,
    pendingCount: transactions.filter(t => String(t.status) === 'pending').length,
    unpaidCount: transactions.filter(t => String(t.status) === 'unpaid').length,
    revenue: transactions.filter(t => String(t.status) === 'paid').reduce((sum, t) => sum + t.amount, 0)
  };

  const unreadNotifCount = notifications.filter(n => n.isRead === false || String(n.isRead).toLowerCase() === 'false').length;
  
  const readBroadcasts = JSON.parse(localStorage.getItem('readBroadcasts') || '[]');
  const tenantCombinedNotifs = isTenant ? [
    ...tenantNotifs,
    ...notifications.filter(n => n.type === 'broadcast').map(n => ({...n, isRead: readBroadcasts.includes(n.id)}))
  ].sort((a, b) => b.id - a.id) : [];
  
  const unreadTenantNotifCount = tenantCombinedNotifs.filter(n => n.isRead === false || String(n.isRead).toLowerCase() === 'false').length;

  const renderContent = () => {
    if (isLoadingData) return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 size={48} className="text-indigo-600 animate-spin mb-4" /><p className="font-bold text-gray-600 animate-pulse">Menghubungkan ke Sistem...</p></div>);

    if (showLandingPage) {
      return (
        <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 font-sans text-gray-800 scroll-smooth relative">
          {isSimulationMode && <div className="bg-red-500 text-white p-3 text-center text-xs sm:text-sm font-bold w-full sticky top-0 z-[60] shadow-md">⚠️ Mode Simulasi Aktif: Gagal terhubung ke API. Pastikan Anda telah memasukkan URL Google Apps Script yang valid.</div>}
          <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 w-full transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between h-16 sm:h-20 items-center">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={(e) => scrollToSection(e, 'beranda')}>
                {siteSettings.appLogo ? <img src={siteSettings.appLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-indigo-200/50 bg-white" /> : <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50"><Home size={22} className="text-white" /></div>}
                <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{siteSettings.appName || 'Kosanku'}</span>
              </div>
              <div className="hidden md:flex space-x-8 text-sm font-bold text-gray-500">
                <a href="#beranda" onClick={(e) => scrollToSection(e, 'beranda')} className="hover:text-indigo-600 transition">Beranda</a>
                <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className="hover:text-indigo-600 transition">Fasilitas</a>
                <a href="#galeri" onClick={(e) => scrollToSection(e, 'galeri')} className="hover:text-indigo-600 transition">Galeri</a>
              </div>
              <div><button onClick={() => setShowLandingPage(false)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:scale-105 transition-all flex items-center">Masuk <span className="hidden sm:inline ml-1">Aplikasi</span> <ArrowRight size={16} className="ml-2" /></button></div>
            </div></div>
          </nav>

          <section id="beranda" className="relative pt-16 sm:pt-20 pb-24 overflow-hidden px-4 sm:px-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center relative z-10">
              <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left mb-12 lg:mb-0">
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-100/50 text-indigo-700 font-bold text-xs sm:text-sm mb-6 border border-indigo-200"><Star size={16} className="mr-2 fill-current" /> Pilihan Kos Terbaik</div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">Hunian Kos Nyaman, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Aman & Strategis.</span></h1>
                <p className="text-base sm:text-lg text-gray-500 mb-8 font-medium">Fasilitas lengkap, kebersihan rutin, dan keamanan 24 jam. Pilihan tepat untuk Anda.</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <button onClick={() => setIsWaModalOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm sm:text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 transition-all hover:-translate-y-1">Butuh Kosan?</button>
                  <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className="px-8 py-4 bg-white text-indigo-600 border border-gray-200 rounded-2xl font-bold text-sm sm:text-lg hover:bg-gray-50 transition-all text-center">Lihat Fasilitas</a>
                </div>
              </div>
              <div className="lg:w-1/2 relative w-full h-[320px] sm:h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src={siteSettings.heroImg} alt="Kamar Kos Modern" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl flex items-center space-x-3 sm:space-x-4 border border-white/50">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><CheckCircle2 size={24} /></div>
                  <div><p className="text-xs sm:text-sm font-extrabold text-gray-800">Kamar Siap Huni</p><p className="text-[10px] sm:text-xs text-gray-500 font-medium">Harga Terbaik</p></div>
                </div>
              </div>
            </div>
          </section>

          <section id="fasilitas" className="py-16 sm:py-24 bg-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16"><h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Fasilitas Unggulan</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[{ icon: BedDouble, title: siteSettings.fac1Title, desc: siteSettings.fac1Desc, color: 'text-blue-600', bg: 'bg-blue-50' }, { icon: Wifi, title: siteSettings.fac2Title, desc: siteSettings.fac2Desc, color: 'text-indigo-600', bg: 'bg-indigo-50' }, { icon: ShieldCheck, title: siteSettings.fac3Title, desc: siteSettings.fac3Desc, color: 'text-green-600', bg: 'bg-green-50' }, { icon: Car, title: siteSettings.fac4Title, desc: siteSettings.fac4Desc, color: 'text-orange-600', bg: 'bg-orange-50' }].map((item, i) => (
                <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all duration-300"><div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}><item.icon size={28} className={item.color} /></div><h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3><p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p></div>
              ))}
            </div>
          </div></section>

          <section id="galeri" className="py-16 sm:py-24 bg-gray-50 border-t border-gray-100"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:text-left"><h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Galeri Kos</h2><p className="text-gray-500 mt-2 text-sm sm:text-base font-medium">Intip suasana nyaman di lingkungan kami.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="h-48 sm:h-64 bg-gray-200 rounded-3xl overflow-hidden border-4 border-white shadow-lg group cursor-pointer"><img src={siteSettings.gallery1} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded-3xl overflow-hidden border-4 border-white shadow-lg group cursor-pointer"><img src={siteSettings.gallery2} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded-3xl overflow-hidden border-4 border-white shadow-lg group cursor-pointer sm:col-span-2 md:col-span-1"><img src={siteSettings.gallery3} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
            </div>
          </div></section>

          <footer id="kontak" className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 mb-12">
              <div><div className="flex items-center space-x-3 mb-6 cursor-pointer" onClick={(e) => scrollToSection(e, 'beranda')}>{siteSettings.appLogo ? <img src={siteSettings.appLogo} className="w-10 h-10 rounded-xl object-cover bg-white shadow-md" /> : <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md"><Home size={22}/></div>}<span className="text-2xl font-extrabold">{siteSettings.appName || 'Kosanku'}</span></div><p className="text-slate-400 text-sm font-medium leading-relaxed">Solusi hunian pintar yang mengutamakan kenyamanan, keamanan, dan kebersihan. Jadikan hari-harimu lebih produktif bersama kami.</p></div>
              <div><h4 className="text-lg font-bold mb-6 text-white">Kontak Kami</h4><ul className="space-y-4 text-slate-400 text-sm font-medium"><li className="flex items-start"><MapPin size={18} className="mr-3 text-indigo-400 flex-shrink-0" /> Tersedia di beberapa area strategis</li><li className="flex items-start"><Phone size={18} className="mr-3 text-indigo-400 flex-shrink-0" /> 0853-4150-3151 (WhatsApp)</li></ul></div>
              <div><h4 className="text-lg font-bold mb-6 text-white">Peta Lokasi</h4><div className="w-full h-40 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative group cursor-pointer shadow-inner"><img src={siteSettings.mapImg} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="bg-slate-900/80 px-4 py-2 rounded-xl text-white text-xs font-bold backdrop-blur-md shadow-lg border border-slate-700">Lihat Peta</span></div></div></div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center sm:text-left"><p className="text-slate-500 text-xs sm:text-sm font-medium">© 2026 {siteSettings.appName || 'Kosanku'}. Hak Cipta Dilindungi.</p><button onClick={() => setShowLandingPage(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-indigo-400 hover:text-white transition flex items-center text-xs sm:text-sm font-bold">Portal Pengelola / Penghuni <ArrowRight size={14} className="ml-1.5" /></button></div>
          </div></footer>
        </div>
      );
    }

    if (!userRole) {
      return (
        <div className="min-h-[100dvh] w-full overflow-x-hidden bg-gray-50 flex flex-col items-center justify-center p-4 relative">
          <button onClick={() => setShowLandingPage(true)} className="absolute top-4 left-4 sm:top-6 sm:left-6 text-gray-500 hover:text-indigo-600 flex items-center text-xs sm:text-sm font-bold transition bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 z-40 mt-12 sm:mt-0"><X size={16} className="mr-1.5" /> Kembali</button>
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] shadow-xl border border-gray-100/60 max-w-md w-full animate-in zoom-in-95 duration-500 mt-20 sm:mt-10">
            <div className="flex justify-center mb-6">{siteSettings.appLogo ? <img src={siteSettings.appLogo} className="w-16 h-16 rounded-2xl object-cover bg-white shadow-lg shadow-indigo-200/50" /> : <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50"><Home size={32} className="text-white" /></div>}</div>
            <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">Masuk {siteSettings.appName || 'Kosanku'}</h1>
            <div className="flex mb-6 bg-gray-50 p-1.5 rounded-2xl border border-gray-100"><button onClick={() => {setLoginRole('tenant'); setLoginError('');}} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${loginRole === 'tenant' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Penyewa</button><button onClick={() => {setLoginRole('owner'); setLoginError('');}} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${loginRole === 'owner' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Pengelola</button></div>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && <p className="text-red-600 text-xs sm:text-sm bg-red-50 p-3 rounded-xl text-center font-bold border border-red-100 animate-in slide-in-from-top-2">{loginError}</p>}
              {loginRole === 'tenant' && (<div><label className="text-sm font-bold text-gray-700 block mb-2">Pilih Area Kos</label><select value={loginPropertyId} onChange={(e) => setLoginPropertyId(e.target.value)} required className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white"><option value="">-- Pilih Area --</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>)}
              <div><label className="text-sm font-bold text-gray-700 block mb-2">{loginRole === 'tenant' ? 'Nama Lengkap Penyewa' : 'Username Admin'}</label><input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required placeholder={loginRole === 'tenant' ? 'Contoh: Budi Santoso' : 'Masukkan username...'} className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"/></div>
              <div><label className="text-sm font-bold text-gray-700 block mb-2">{loginRole === 'tenant' ? 'Kata Sandi (Nomor Kamar)' : 'Kata Sandi'}</label><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required placeholder={loginRole === 'tenant' ? 'Contoh: 101' : 'Masukkan kata sandi...'} className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"/></div>
              <button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200/50 hover:scale-[1.02] transition-all mt-4">Masuk Sekarang</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-slate-50/50 flex font-sans text-gray-800 relative">
        {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-white border-r border-gray-100/80 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-50/80 mb-2">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition" onClick={() => setShowLandingPage(true)}>
              {siteSettings.appLogo ? <img src={siteSettings.appLogo} className="w-8 h-8 rounded-lg object-cover shadow-md shadow-indigo-200/50 border border-gray-100" /> : <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200/50"><Home size={16} className="text-white" /></div>}
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 truncate">{siteSettings.appName || 'Kosanku'}</span>
            </div>
            <button className="md:hidden text-gray-400 p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          {isOwner && (
            <div className="px-4 mb-2 pb-4 border-b border-gray-50/80">
              <div className="mb-4">
                <label className="text-[10px] font-bold text-gray-400 mb-1 flex items-center uppercase tracking-wider"><MapPin size={12} className="mr-1"/> Area Properti</label>
                <div className="relative">
                  <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="w-full appearance-none bg-indigo-50/50 border border-indigo-100/80 text-indigo-900 text-sm rounded-xl px-4 py-2.5 pr-8 font-bold cursor-pointer truncate mb-2 focus:outline-none">
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none pb-2" />
                </div>
                <button onClick={()=>setIsAddPropertyModalOpen(true)} className="w-full bg-white border border-green-200 text-green-600 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-green-50 transition flex items-center justify-center space-x-2"><Plus size={14}/> <span>Tambah Area</span></button>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 mb-2 flex items-center uppercase tracking-wider"><WalletCards size={12} className="mr-1"/> Semua Area</label>
                <SidebarItem icon={WalletCards} label="Laporan Keuangan" viewId="finance" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/>
              </div>
            </div>
          )}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 custom-scrollbar">
            {isOwner ? (
              <><SidebarItem icon={Home} label="Dashboard" viewId="dashboard" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/><SidebarItem icon={Building} label="Area & Unit" viewId="rooms" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/><SidebarItem icon={Users} label="Penghuni" viewId="tenants" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/><SidebarItem icon={Settings} label="Pengaturan" viewId="settings" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/></>
            ) : (
              <><SidebarItem icon={Home} label="Beranda" viewId="dashboard" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/><SidebarItem icon={WalletCards} label="Tagihan Saya" viewId="finance" currentView={currentView} setCurrentView={setCurrentView} setIsSidebarOpen={setIsSidebarOpen}/></>
            )}
          </nav>
          <div className="p-4 border-t border-gray-50/80 bg-gray-50/30">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center space-x-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${isOwner ? 'bg-indigo-600' : 'bg-purple-600'}`}>{isOwner ? 'A' : 'T'}</div><div><p className="text-sm font-bold text-gray-800 line-clamp-1">{isOwner ? (allAdmins[0]?.username || 'Admin') : myTenantProfile?.name}</p><p className="text-xs text-gray-500 font-medium">{isOwner ? 'Pemilik Kos' : `Kamar ${myRoom?.number}`}</p></div></div>
              <button onClick={handleLogout} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-[100dvh] max-w-full overflow-hidden w-full relative">
          <header className="h-[68px] sm:h-[76px] bg-white/80 backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 w-full transition-all">
            <div className="flex items-center"><button className="md:hidden mr-3 sm:mr-4 text-gray-600 hover:text-indigo-600 bg-gray-100/50 p-2.5 rounded-xl transition" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button><h1 className="text-base sm:text-xl font-extrabold text-gray-800 capitalize truncate max-w-[160px] sm:max-w-[300px]">{currentView}</h1></div>
            <div className="flex items-center space-x-2.5 md:space-x-4">
              <button onClick={() => fetchGoogleSheetsData(false, true)} className={`p-2.5 transition rounded-xl ${isSyncing ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}><RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /></button>
              
              {isOwner && (
                <button onClick={() => setIsBroadcastModalOpen(true)} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center shadow-sm hover:bg-indigo-100 transition">
                  <MessageCircle size={16} className="md:mr-2" /> <span className="hidden md:inline">Pengumuman</span>
                </button>
              )}
              {isTenant && (
                <button onClick={() => setReportModalOpen(true)} className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center shadow-sm hover:bg-red-100 transition">
                  <AlertTriangle size={16} className="md:mr-2" /> <span className="hidden md:inline">Lapor Kendala</span>
                </button>
              )}

              {/* IKON NOTIFIKASI GABUNGAN UNTUK PENGELOLA DAN PENYEWA */}
              {(isOwner || isTenant) && (
                <div className="relative">
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`relative p-2.5 transition rounded-xl ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}>
                    <Bell size={18} />
                    {(isOwner ? unreadNotifCount : unreadTenantNotifCount) > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white rounded-3xl shadow-2xl border border-gray-100/80 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                        <button onClick={() => { 
                          if(isOwner) {
                            setNotifications(notifications.map(n => ({...n, isRead: true}))); 
                            sendDataToSheets('markAllNotificationsRead', {}); 
                          } else {
                            const newReadBroadcasts = [...readBroadcasts, ...tenantCombinedNotifs.filter(n => String(n.type) === 'broadcast').map(n => n.id)];
                            localStorage.setItem('readBroadcasts', JSON.stringify(newReadBroadcasts));
                            setTenantNotifs(tenantNotifs.map(n => ({...n, isRead: true})));
                          }
                        }} className="text-xs text-indigo-600 font-bold hover:underline">Tandai dibaca</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {(isOwner ? notifications : tenantCombinedNotifs).length === 0 ? <p className="text-center text-sm py-8 text-gray-400 font-medium">Belum ada aktivitas.</p> : (isOwner ? notifications : tenantCombinedNotifs).map(notif => {
                        const isUnread = notif.isRead === false || String(notif.isRead).toLowerCase() === 'false';
                        return (
                          <div key={notif.id} className={`p-4 border-b border-gray-50 ${isUnread ? 'bg-indigo-50/30' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${isUnread ? (String(notif.type)==='warning'?'bg-red-500':'bg-indigo-500') : 'bg-transparent'}`}></div>
                              <div className="flex-1">
                                <p className={`text-sm font-bold ${String(notif.type)==='warning'?'text-red-600':'text-gray-800'}`}>{notif.title}</p>
                                <p className="text-xs text-gray-500 mt-1 font-medium">{notif.message}</p>
                                {notif.time && <span className="text-[10px] text-gray-400 mt-2 block">{notif.time}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto w-full pb-28 sm:pb-8">
            {currentView === 'dashboard' && (isOwner ? (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100/60 flex flex-col justify-between"><div className="flex items-center justify-between mb-3"><h3 className="text-gray-500 text-xs sm:text-sm font-medium">Penghuni</h3><div className="p-1.5 sm:p-2 bg-blue-50 rounded-xl"><Users size={18} className="text-blue-500" /></div></div><div><div className="text-xl sm:text-3xl font-extrabold text-gray-800">{stats.totalTenants}</div><p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">Orang Aktif</p></div></div>
                  <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100/60 flex flex-col justify-between"><div className="flex items-center justify-between mb-3"><h3 className="text-gray-500 text-xs sm:text-sm font-medium">Kamar Isi</h3><div className="p-1.5 sm:p-2 bg-indigo-50 rounded-xl"><Building size={18} className="text-indigo-500" /></div></div><div><div className="text-xl sm:text-3xl font-extrabold text-gray-800">{stats.occupiedRooms} <span className="text-sm sm:text-lg text-gray-400">/ {stats.totalRooms}</span></div><p className="text-[10px] sm:text-xs text-indigo-500 mt-1 font-bold">{stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}% Terisi</p></div></div>
                  <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-yellow-100 flex flex-col justify-between cursor-pointer hover:bg-yellow-50/50 transition" onClick={()=>setCurrentView('finance')}><div className="flex items-center justify-between mb-3"><h3 className="text-yellow-700 text-xs sm:text-sm font-bold">Verifikasi</h3><div className="p-1.5 sm:p-2 bg-yellow-100 rounded-xl"><Clock size={18} className="text-yellow-600" /></div></div><div><div className="text-xl sm:text-3xl font-extrabold text-gray-800">{stats.pendingCount}</div><p className="text-[10px] sm:text-xs text-yellow-600 mt-1 font-medium">Butuh dicek</p></div></div>
                  <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col justify-between cursor-pointer hover:bg-red-50/50 transition" onClick={()=>setCurrentView('finance')}><div className="flex items-center justify-between mb-3"><h3 className="text-red-700 text-xs sm:text-sm font-bold">Tertunda</h3><div className="p-1.5 sm:p-2 bg-red-100 rounded-xl"><AlertCircle size={18} className="text-red-600" /></div></div><div><div className="text-xl sm:text-3xl font-extrabold text-gray-800">{stats.unpaidCount}</div><p className="text-[10px] sm:text-xs text-red-500 mt-1 font-medium">Belum bayar</p></div></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden">
                  <div className="relative z-10"><h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Halo, {myTenantProfile?.name}! 👋</h2><p className="text-indigo-100 mb-6 flex items-center text-sm sm:text-base font-medium"><MapPin size={16} className="mr-1.5 opacity-80"/> Kamar {myRoom?.number} • {properties.find(p=>String(p.id) === String(myRoom?.propertyId))?.name}</p><div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setCurrentView('finance')} className="bg-white text-indigo-600 px-5 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition w-full sm:w-auto text-center">Lihat Tagihan Saya</button><button onClick={() => setReportModalOpen(true)} className="bg-red-500/20 backdrop-blur-md border border-red-400/30 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-red-500/40 transition flex items-center justify-center w-full sm:w-auto"><AlertTriangle size={16} className="mr-2" /> Lapor Kendala</button></div></div>
                  <BedDouble size={140} className="absolute -bottom-8 -right-8 text-white opacity-10 rotate-12" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 p-5 sm:p-6"><h3 className="font-bold text-gray-800 mb-5 flex items-center text-base sm:text-lg"><Home size={20} className="mr-2 text-indigo-500"/> Info Kamar Saya</h3><div className="space-y-4"><div className="flex justify-between items-center py-2 border-b border-gray-50"><span className="text-gray-500 text-sm">Tipe Unit</span><span className="font-bold text-gray-800 text-sm bg-gray-50 px-3 py-1 rounded-lg">{myRoom?.type}</span></div><div className="flex justify-between items-center py-2 border-b border-gray-50"><span className="text-gray-500 text-sm">Biaya Bulanan</span><span className="font-bold text-gray-800 text-sm">{formatRupiah(myRoom?.price)}</span></div><div className="pt-2"><span className="text-gray-500 text-sm block mb-3">Fasilitas:</span><div className="flex flex-wrap gap-2">{(Array.isArray(myRoom?.facilities)?myRoom.facilities:[]).map((fac, idx)=>(<span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-medium">{fac}</span>))}</div></div></div></div>
                </div>
              </div>
            ))}
            {currentView === 'finance' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><h2 className="text-xl sm:text-2xl font-bold text-gray-800">Laporan Keuangan</h2><p className="text-xs sm:text-sm text-gray-500 mt-1">{isOwner ? 'Pemantauan transaksi seluruh area kos' : 'Pemantauan tagihan Anda'}</p></div>
                  <div className="flex flex-wrap w-full sm:w-auto gap-2">
                    <select value={financeFilter} onChange={(e)=>setFinanceFilter(e.target.value)} className="flex-1 sm:flex-none border border-gray-200 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white"><option value="all">Semua Status</option><option value="paid">Lunas</option><option value="pending">Verifikasi</option><option value="unpaid">Belum Lunas</option></select>
                    {isOwner && <><button onClick={() => setIsReportModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition flex items-center justify-center"><FileText size={16} className="sm:mr-2" /> <span className="hidden sm:inline">Rangkuman PDF</span></button><button onClick={handleDownloadCSV} className="w-12 sm:w-auto bg-white border border-gray-200 text-gray-700 sm:px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition flex items-center justify-center"><Download size={16} className="sm:mr-2" /> <span className="hidden sm:inline">Export</span></button></>}
                  </div>
                </div>
                
                {isOwner ? (
                  <>
                    {properties.map(prop => {
                      const propTransactions = allTransactions.filter(t => String(t.propertyId) === String(prop.id) && (financeFilter === 'all' || String(t.status) === financeFilter));
                      if (propTransactions.length === 0 && financeFilter !== 'all') return null;

                      const monthlySums = {};
                      allTransactions.filter(t => String(t.propertyId) === String(prop.id) && String(t.status) === 'paid').forEach(trx => { monthlySums[trx.month] = (monthlySums[trx.month] || 0) + Number(trx.amount); });
                      
                      return (
                        <div key={prop.id} className="bg-white rounded-3xl shadow-sm border border-gray-100/60 overflow-hidden mb-6">
                          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div><h3 className="font-extrabold text-gray-800 text-base sm:text-lg flex items-center"><Building size={18} className="mr-2 text-indigo-500"/> {prop.name}</h3><p className="text-xs text-gray-500 flex items-center mt-1"><MapPin size={12} className="mr-1 opacity-70"/> {prop.address}</p></div>
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(monthlySums).length > 0 ? Object.keys(monthlySums).map(month => (
                                <div key={month} className="bg-white px-3 py-1.5 rounded-xl border border-green-200/60 shadow-sm flex items-center space-x-2"><span className="text-[10px] text-green-600 uppercase font-bold bg-green-50 px-2 py-1 rounded-lg">{month}</span><span className="text-sm font-extrabold text-green-700">{formatRupiah(monthlySums[month])}</span></div>
                              )) : <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-xl border border-gray-100 font-medium">Belum ada pendapatan lunas.</span>}
                            </div>
                          </div>
                          <div className="overflow-x-auto hide-scroll-mobile custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-white border-b border-gray-50">
                                <tr><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Invoice</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Penghuni & Unit</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Bulan</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Jumlah</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th></tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {propTransactions.map(trx => {
                                  const tenant = allTenants.find(t => String(t.id) === String(trx.tenantId));
                                  const room = allRooms.find(r => String(r.id) === String(trx.roomId));
                                  return (
                                    <tr key={trx.id} className="hover:bg-gray-50/50 transition">
                                      <td className="p-4 sm:p-5 text-sm font-bold text-gray-700 whitespace-nowrap">INV-{trx.id}</td>
                                      <td className="p-4 sm:p-5 whitespace-nowrap"><p className="text-sm font-bold text-gray-800">{tenant?.name}</p><p className="text-xs text-indigo-500 font-medium mt-0.5">Unit {room?.number}</p></td>
                                      <td className="p-4 sm:p-5 text-sm font-medium text-gray-600 whitespace-nowrap">{trx.month}</td>
                                      <td className="p-4 sm:p-5 text-sm font-extrabold text-gray-800 whitespace-nowrap">{formatRupiah(trx.amount)}</td>
                                      <td className="p-4 sm:p-5 whitespace-nowrap">
                                        {String(trx.status) === 'paid' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-100"><CheckCircle2 size={12} className="mr-1.5" /> Lunas</span>}
                                        {String(trx.status) === 'unpaid' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-100"><XCircle size={12} className="mr-1.5" /> Belum Lunas</span>}
                                        {String(trx.status) === 'pending' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock size={12} className="mr-1.5" /> Verifikasi</span>}
                                      </td>
                                      <td className="p-4 sm:p-5 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                          {String(trx.status) === 'pending' && <>{trx.proofUrl && <button onClick={() => setProofModal({ isOpen: true, imageUrl: trx.proofUrl })} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 font-bold transition">Bukti</button>}<button onClick={() => handleConfirmPayment(trx.id)} className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 font-bold shadow-sm shadow-indigo-200 transition">Konfirmasi</button></>}
                                          {String(trx.status) === 'unpaid' && <button onClick={() => handleSendWA(tenant, room, trx)} className="text-xs bg-green-50 text-green-600 px-3 py-2 rounded-xl border border-green-100 font-bold flex items-center hover:bg-green-100 transition"><MessageCircle size={14} className="mr-1" /> Tagih</button>}
                                          {String(trx.status) === 'paid' && <button onClick={()=>handlePrintReceipt(trx)} className="text-xs border border-gray-200 bg-white text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 font-bold transition">Struk</button>}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                                {propTransactions.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-sm text-gray-400 font-medium">Tidak ada transaksi yang sesuai filter.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                    
                    <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 sm:p-8 rounded-[2rem] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl shadow-indigo-200/50">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-indigo-50">Total Nominal Laporan</h3>
                        <p className="text-sm text-indigo-200 mt-1 font-medium">Berdasarkan filter status: <span className="uppercase text-white">{financeFilter === 'all' ? 'Semua' : financeFilter === 'paid' ? 'Lunas' : financeFilter === 'pending' ? 'Verifikasi' : 'Belum Lunas'}</span></p>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
                        {formatRupiah(allTransactions.filter(t => financeFilter === 'all' || String(t.status) === financeFilter).reduce((acc, curr) => acc + Number(curr.amount), 0))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 overflow-hidden">
                    <div className="overflow-x-auto hide-scroll-mobile custom-scrollbar"><table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50/50"><tr className="border-b border-gray-100"><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">Invoice</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">Bulan</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">Jumlah</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">Status</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-400 uppercase text-right whitespace-nowrap">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {myTransactions.filter(t=>financeFilter==='all'||String(t.status)===financeFilter).map(trx => (
                          <tr key={trx.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-4 sm:p-5 text-sm font-bold text-gray-700 whitespace-nowrap">INV-{trx.id}</td>
                            <td className="p-4 sm:p-5 text-sm font-medium text-gray-600 whitespace-nowrap">{trx.month}</td>
                            <td className="p-4 sm:p-5 text-sm font-extrabold text-gray-800 whitespace-nowrap">{formatRupiah(trx.amount)}</td>
                            <td className="p-4 sm:p-5 whitespace-nowrap">
                              {String(trx.status) === 'paid' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-100"><CheckCircle2 size={12} className="mr-1.5" /> Lunas</span>}
                              {String(trx.status) === 'unpaid' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-100"><XCircle size={12} className="mr-1.5" /> Belum Lunas</span>}
                              {String(trx.status) === 'pending' && <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock size={12} className="mr-1.5" /> Verifikasi</span>}
                            </td>
                            <td className="p-4 sm:p-5 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                {String(trx.status) === 'unpaid' && <button onClick={()=>setUploadModal({isOpen:true, transactionId: trx.id})} className="text-xs bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 font-bold shadow-sm transition">Bayar</button>}
                                {String(trx.status) === 'paid' && <button onClick={()=>handlePrintReceipt(trx)} className="text-xs border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 font-bold transition">Struk</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {myTransactions.filter(t=>financeFilter==='all'||String(t.status)===financeFilter).length === 0 && <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">Tidak ada transaksi.</td></tr>}
                      </tbody>
                    </table></div>
                  </div>
                )}
              </div>
            )}
            {isOwner && currentView === 'rooms' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><h2 className="text-xl sm:text-2xl font-bold text-gray-800">Unit Kamar</h2><p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1"><MapPin size={14} className="mr-1 opacity-70"/> {selectedPropertyDetails?.address}</p></div>
                  <div className="flex w-full sm:w-auto gap-2"><button onClick={openEditPropertyModal} className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition flex items-center justify-center space-x-2"><Settings size={16} /> <span className="hidden sm:inline">Edit Area</span></button><button onClick={()=>setIsAddRoomModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-200/50"><Plus size={18} /> <span>Tambah Unit</span></button></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">{rooms.map(room => {
                  const tenant = tenants.find(t => String(t.id) === String(room.tenantId));
                  return (<div key={room.id} className="bg-white rounded-3xl shadow-sm border border-gray-100/60 p-5 sm:p-6 hover:border-indigo-100 transition duration-300 group"><div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-extrabold text-gray-800">Unit {room.number}</h3><p className="text-xs text-gray-400 mt-1 font-medium bg-gray-50 inline-block px-2 py-0.5 rounded-md">{room.type}</p></div>{String(room.status) === 'available' && <span className="bg-green-50 text-green-600 text-xs px-3 py-1.5 rounded-xl font-bold border border-green-100">Tersedia</span>}{String(room.status) === 'occupied' && <span className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-xl font-bold border border-indigo-100">Terisi</span>}{String(room.status) === 'maintenance' && <span className="bg-yellow-50 text-yellow-600 text-xs px-3 py-1.5 rounded-xl font-bold border border-yellow-100">Perbaikan</span>}</div><div className="space-y-3 mb-6 bg-gray-50/50 p-3 rounded-2xl"><div className="flex items-center text-sm text-gray-700 font-medium"><WalletCards size={16} className="mr-3 text-indigo-400" /> {formatRupiah(room.price)} <span className="text-gray-400 font-normal ml-1">/ bln</span></div>{String(room.status) === 'occupied' && tenant && (<div className="flex items-center text-sm text-gray-700 font-medium"><Users size={16} className="mr-3 text-blue-400" /> {tenant.name}</div>)}</div><div className="flex gap-2"><button onClick={() => openEditRoomModal(room)} className="flex-1 bg-white border border-gray-200 text-gray-700 text-sm py-2.5 rounded-xl hover:bg-gray-50 font-bold transition flex items-center justify-center"><Edit size={14} className="mr-2" /> Edit</button><button onClick={() => handleDeleteRoom(room.id)} className="w-11 bg-red-50 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition flex items-center justify-center" title="Hapus Unit"><Trash2 size={16} /></button></div></div>)
                })}</div>
              </div>
            )}
            {isOwner && currentView === 'tenants' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-xl sm:text-2xl font-bold text-gray-800">Daftar Penghuni</h2><div className="flex w-full sm:w-auto space-x-2"><div className="relative flex-1 sm:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} placeholder="Cari penghuni..." className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-2xl text-base sm:text-sm focus:outline-none focus:border-indigo-500 bg-white" /></div><button onClick={()=>setIsAddTenantModalOpen(true)} className="text-white bg-indigo-600 px-4 py-2.5 rounded-2xl text-sm font-bold transition flex items-center justify-center shadow-md"><Plus size={18} /> <span className="hidden sm:inline ml-2">Tambah</span></button></div></div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 overflow-hidden"><div className="overflow-x-auto hide-scroll-mobile custom-scrollbar"><table className="w-full text-left border-collapse"><thead className="bg-gray-50/50"><tr className="border-b border-gray-100"><th className="p-4 sm:p-5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Nama Penghuni</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Unit</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Kontak</th><th className="p-4 sm:p-5 text-xs font-semibold text-gray-500 uppercase text-right whitespace-nowrap">Aksi</th></tr></thead><tbody className="divide-y divide-gray-50">{tenants.filter(t => String(t.name).toLowerCase().includes(String(tenantSearch).toLowerCase())).map(tenant => {const room = rooms.find(r => String(r.id) === String(tenant.roomId)); return (<tr key={tenant.id} className="hover:bg-gray-50/30 transition"><td className="p-4 sm:p-5 whitespace-nowrap"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold">{String(tenant.name).charAt(0)}</div><div><p className="text-sm font-bold text-gray-800">{tenant.name}</p><p className="text-xs text-gray-400 mt-0.5">ID: KSN-{tenant.id}</p></div></div></td><td className="p-4 sm:p-5 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700">{room ? `Unit ${room.number}` : '-'}</span></td><td className="p-4 sm:p-5 whitespace-nowrap"><div className="flex flex-col space-y-1.5"><span className="text-sm text-gray-700 flex items-center font-medium"><Phone size={14} className="mr-2 text-gray-400"/> {tenant.phone}</span><span className="text-xs text-red-500 flex items-center font-medium"><AlertCircle size={14} className="mr-2"/> Darurat: {tenant.emergencyContact}</span></div></td><td className="p-4 sm:p-5 text-right whitespace-nowrap"><button onClick={()=>handleCheckoutTenant(tenant.id, tenant.roomId, tenant.name)} className="text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 text-xs font-bold transition border border-red-100">Keluarkan</button></td></tr>)})}</tbody></table></div></div>
              </div>
            )}
            {isOwner && currentView === 'settings' && <AdminSettings allAdmins={allAdmins} siteSettings={siteSettings} sendDataToSheets={sendDataToSheets} showMessage={showMessage} setAllAdmins={setAllAdmins} setSiteSettings={setSiteSettings} />}
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } 
        @media (max-width: 640px) { 
          .hide-scroll-mobile::-webkit-scrollbar { display: none; } 
          .hide-scroll-mobile { -ms-overflow-style: none; scrollbar-width: none; } 
        }
        @media print {
          body, html { 
            background-color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
            height: auto !important;
            overflow: visible !important;
          }
          @page { margin: 15mm; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
      
      <div className="print:hidden">
        {renderContent()}
        
        {/* MODAL GLOBAL SCREEN VERSION */}
        {messageBox.isOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-sm overflow-hidden animate-in zoom-in-95 flex flex-col"><div className={`p-5 border-b border-gray-100 flex items-center ${messageBox.type === 'error' ? 'bg-red-50/80 text-red-700' : messageBox.type === 'warning' ? 'bg-yellow-50/80 text-yellow-700' : 'bg-indigo-50/80 text-indigo-700'}`}>{messageBox.type === 'error' ? <XCircle size={24} className="mr-3"/> : messageBox.type === 'warning' ? <AlertTriangle size={24} className="mr-3"/> : <Info size={24} className="mr-3"/>}<h3 className="font-extrabold text-lg">{messageBox.title}</h3></div><div className="p-6 text-gray-700 text-sm font-medium leading-relaxed">{messageBox.message}</div><div className="p-4 sm:p-5 bg-gray-50/50 flex justify-end"><button onClick={() => setMessageBox({isOpen: false, title: '', message: '', type: 'info'})} className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition">Mengerti</button></div></div></div>)}
        {uploadModal.isOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0"><h3 className="font-extrabold text-lg text-gray-800">Unggah Bukti Transfer</h3><button onClick={() => { setUploadModal({ isOpen: false, transactionId: null }); setUploadPreview(null); }} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar"><input type="file" id="proof-upload" accept="image/*" className="hidden" onChange={handleFileChange} /><label htmlFor="proof-upload" className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-3xl p-8 flex flex-col items-center text-center cursor-pointer hover:bg-indigo-50 transition min-h-[200px] justify-center relative overflow-hidden group">{uploadPreview ? (<img src={uploadPreview} alt="Preview Bukti" className="absolute inset-0 w-full h-full object-contain bg-black/5" />) : (<><div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform"><Upload size={24} /></div><p className="text-sm font-bold text-gray-800">Sentuh untuk Pilih Foto</p><p className="text-xs text-gray-500 mt-2 font-medium">Format: JPG, PNG, JPEG</p></>)}</label></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button onClick={() => { setUploadModal({ isOpen: false, transactionId: null }); setUploadPreview(null); }} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button onClick={handleTenantUpload} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-200/50">Kirim Bukti</button></div></div></div>)}
        {proofModal.isOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0"><h3 className="font-extrabold text-lg text-gray-800">Foto Bukti Pembayaran</h3><button onClick={() => setProofModal({ isOpen: false, imageUrl: null })} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><div className="p-0 overflow-y-auto bg-gray-50/50 flex justify-center items-center min-h-[300px] custom-scrollbar relative">{proofModal.imageUrl && <img src={proofModal.imageUrl} alt="Bukti Pembayaran" className="w-full h-auto object-contain max-h-[60vh]" />}</div><div className="p-4 sm:p-5 bg-white flex justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button onClick={() => setProofModal({ isOpen: false, imageUrl: null })} className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-bold shadow-sm">Tutup Bukti</button></div></div></div>)}
        {receiptModal.isOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-sm overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0"><h3 className="font-extrabold text-lg text-gray-800">Struk Lunas</h3><button onClick={() => setReceiptModal({isOpen: false, data: null})} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><div className="p-6 sm:p-8 text-center space-y-4 overflow-y-auto custom-scrollbar"><div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-2"><CheckCircle2 size={36} /></div><h2 className="text-2xl font-black text-gray-800">LUNAS</h2><div className="text-left border-t-2 border-b-2 border-dashed border-gray-200 py-5 my-5 space-y-3"><div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Invoice ID</span><span className="font-bold">INV-{receiptModal.data?.id}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Bulan</span><span className="font-bold">{receiptModal.data?.month}</span></div></div><div className="flex justify-between items-center text-lg"><span className="font-bold text-gray-800">Total</span><span className="font-black text-indigo-600">{formatRupiah(receiptModal.data?.amount)}</span></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex-shrink-0 border-t border-gray-100"><button onClick={() => setReceiptModal({isOpen: false, data: null})} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Tutup</button><button type="button" onClick={executePrint} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold flex justify-center items-center shadow-md transition"><Printer size={16} className="mr-2"/> Cetak Struk</button></div></div></div>)}
        {isAddTenantModalOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><Users size={20} className="mr-2"/> Tambah Penghuni</h3><button onClick={() => setIsAddTenantModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleAddTenant} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Lengkap</label><input type="text" required value={newTenantData.name} onChange={(e) => setNewTenantData({...newTenantData, name: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Nomor WhatsApp</label><input type="tel" required value={newTenantData.phone} onChange={(e) => setNewTenantData({...newTenantData, phone: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Kontak Darurat</label><input type="tel" required value={newTenantData.emergencyContact} onChange={(e) => setNewTenantData({...newTenantData, emergencyContact: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Pilih Unit Kamar</label><select required value={newTenantData.roomId} onChange={(e) => setNewTenantData({...newTenantData, roomId: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"><option value="">-- Pilih Unit Tersedia --</option>{rooms.filter(r => String(r.status) === 'available').map(room => (<option key={room.id} value={room.id}>Unit {room.number} - {room.type} ({formatRupiah(room.price)})</option>))}</select></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" disabled={isSaving} onClick={() => setIsAddTenantModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" disabled={isSaving} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-200/50 disabled:opacity-70 transition">{isSaving ? 'Menyimpan...' : 'Simpan Penghuni'}</button></div></form></div></div>)}
        {isAddRoomModalOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><Building size={20} className="mr-2"/> Tambah Unit Kamar</h3><button onClick={() => setIsAddRoomModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleAddRoom} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="text-sm font-bold text-gray-700 block mb-2">Nomor / Identitas Kamar</label><input type="text" required value={newRoomData.number} onChange={(e) => setNewRoomData({...newRoomData, number: e.target.value})} placeholder="Contoh: 105" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Tipe Unit</label><select required value={newRoomData.type} onChange={(e) => setNewRoomData({...newRoomData, type: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"><option value="Standard">Standard</option><option value="VIP">VIP</option></select></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Harga Bulanan (Rp)</label><input type="number" required value={newRoomData.price} onChange={(e) => setNewRoomData({...newRoomData, price: e.target.value})} placeholder="Contoh: 1500000" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setIsAddRoomModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-200/50">Tambah Unit</button></div></form></div></div>)}
        {checkoutModal.isOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-red-100 flex justify-between items-center bg-red-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-red-600 flex items-center"><AlertTriangle size={20} className="mr-2"/> Konfirmasi Checkout</h3><button onClick={() => setCheckoutModal({isOpen: false, tenantId: null, roomId: null, tenantName: ''})} className="text-red-400 hover:bg-red-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar"><p className="text-sm text-gray-700 font-medium">Apakah Anda yakin ingin mengeluarkan penghuni <strong>{checkoutModal.tenantName}</strong>?</p><div className="bg-red-50 p-4 rounded-xl mt-4 border border-red-100"><p className="text-xs text-red-600 font-bold leading-relaxed">Perhatian: Unit kamar yang ditempati akan otomatis diubah statusnya menjadi 'Tersedia' (kosong).</p></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button onClick={() => setCheckoutModal({isOpen: false})} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button onClick={confirmCheckoutTenant} className="w-full sm:w-auto px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-red-200/50 transition">Keluarkan Penghuni</button></div></div></div>)}
        {isReportModalOpen && isOwner && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]">
              <div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0">
                <h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><FileText size={20} className="mr-2"/> Laporan Keuangan Seluruh Area</h3>
                <button onClick={() => setIsReportModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button>
              </div>
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
                {properties.map(prop => {
                   const propMonthly = {};
                   allTransactions.filter(t => String(t.propertyId) === String(prop.id) && String(t.status) === 'paid').forEach(trx => { propMonthly[trx.month] = (propMonthly[trx.month] || 0) + Number(trx.amount); });
                   const propTotal = Object.values(propMonthly).reduce((a,b)=>a+b, 0);
                   
                   return (
                     <div key={prop.id} className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                       <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                         <h4 className="font-bold text-gray-800 flex items-center"><Building size={16} className="mr-2 text-indigo-500"/> {prop.name}</h4>
                         <span className="font-extrabold text-green-600">{formatRupiah(propTotal)}</span>
                       </div>
                       <table className="w-full text-left">
                          <tbody className="divide-y divide-gray-50">
                            {Object.keys(propMonthly).length > 0 ? Object.keys(propMonthly).map(month => (
                              <tr key={month} className="hover:bg-gray-50/50 transition">
                                <td className="px-5 py-3 text-sm font-medium text-gray-700">{month}</td>
                                <td className="px-5 py-3 text-sm font-bold text-gray-800 text-right">{formatRupiah(propMonthly[month])}</td>
                              </tr>
                            )) : <tr><td colSpan="2" className="px-5 py-4 text-center text-sm text-gray-400 font-medium">Belum ada pendapatan lunas di area ini.</td></tr>}
                          </tbody>
                       </table>
                     </div>
                   )
                })}
                
                <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-green-800">Total Pemasukan Seluruh Area</h4>
                    <p className="text-xs text-green-600 mt-1 font-medium">Akumulasi pendapatan lunas</p>
                  </div>
                  <div className="text-3xl font-black text-green-700">{formatRupiah(allTransactions.filter(t=>String(t.status)==='paid').reduce((acc, curr) => acc + Number(curr.amount), 0))}</div>
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100">
                <button onClick={() => setIsReportModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Tutup</button>
                <button type="button" onClick={executePrint} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center"><Printer size={16} className="mr-2"/> Cetak / Simpan PDF</button>
              </div>
            </div>
          </div>
        )}
        {reportModalOpen && isTenant && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-red-100 flex justify-between items-center bg-red-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-red-600 flex items-center"><AlertTriangle size={20} className="mr-2"/> Lapor Kendala Kos</h3><button onClick={() => setReportModalOpen(false)} className="text-red-400 hover:bg-red-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleReportIssue} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><p className="text-sm text-gray-600 font-medium mb-2">Tuliskan kendala Anda dengan jelas agar pengelola dapat segera menindaklanjuti.</p><textarea required value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Contoh: AC kamar 101 netes air sejak semalam..." className="w-full border border-gray-200 rounded-2xl p-4 text-base sm:text-sm font-medium focus:outline-none focus:border-red-400 min-h-[140px] bg-gray-50/50"></textarea></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setReportModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-md transition">Kirim Laporan</button></div></form></div></div>)}
        {isBroadcastModalOpen && isOwner && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><MessageCircle size={20} className="mr-2"/> Kirim Pengumuman</h3><button onClick={() => setIsBroadcastModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleSendBroadcast} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><p className="text-sm text-gray-600 font-medium mb-2">Informasi ini akan muncul di notifikasi seluruh penghuni kos Anda.</p><textarea required value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Tuliskan informasi atau pengumuman..." className="w-full border border-gray-200 rounded-2xl p-4 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 min-h-[140px] bg-gray-50/50"></textarea></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setIsBroadcastModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition">Kirim Pengumuman</button></div></form></div></div>)}
        {isEditRoomModalOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><Edit size={20} className="mr-2"/> Edit Data Unit</h3><button onClick={() => setIsEditRoomModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleSaveRoomEdit} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="text-sm font-bold text-gray-700 block mb-2">Nomor / Identitas Kamar</label><input type="text" required value={editRoomData.number} onChange={(e) => setEditRoomData({...editRoomData, number: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Harga Bulanan (Rp)</label><input type="number" required value={editRoomData.price} onChange={(e) => setEditRoomData({...editRoomData, price: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Status Unit</label><select required value={editRoomData.status} onChange={(e) => setEditRoomData({...editRoomData, status: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white"><option value="available">Tersedia</option><option value="occupied">Terisi</option><option value="maintenance">Perbaikan</option></select></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setIsEditRoomModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition">Simpan</button></div></form></div></div>)}
        {deleteRoomModal.isOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-red-100 flex justify-between items-center bg-red-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-red-600 flex items-center"><AlertTriangle size={20} className="mr-2"/> Hapus Unit Permanen</h3><button onClick={() => setDeleteRoomModal({isOpen: false})} className="text-red-400 hover:bg-red-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar"><p className="text-sm text-gray-700 font-medium">Apakah Anda yakin ingin menghapus unit kamar ini secara permanen?</p></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button onClick={() => setDeleteRoomModal({isOpen: false})} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button onClick={confirmDeleteRoom} className="w-full sm:w-auto px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-md transition">Ya, Hapus</button></div></div></div>)}
        {isAddPropertyModalOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-green-100 flex justify-between items-center bg-green-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-green-700 flex items-center"><MapPin size={20} className="mr-2"/> Tambah Area Baru</h3><button onClick={() => setIsAddPropertyModalOpen(false)} className="text-green-500 hover:bg-green-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleAddProperty} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Area</label><input type="text" required value={newPropertyData.name} onChange={(e)=>setNewPropertyData({...newPropertyData, name: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-green-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Alamat</label><textarea required value={newPropertyData.address} onChange={(e)=>setNewPropertyData({...newPropertyData, address: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-green-500"></textarea></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Penanggung Jawab</label><input type="text" required value={newPropertyData.manager} onChange={(e)=>setNewPropertyData({...newPropertyData, manager: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-green-500"/></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setIsAddPropertyModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-bold shadow-md transition">Simpan Area</button></div></form></div></div>)}
        {editPropertyModalOpen && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[90vh]"><div className="p-5 sm:p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-indigo-700 flex items-center"><Settings size={20} className="mr-2"/> Edit Data Area</h3><button onClick={() => setEditPropertyModalOpen(false)} className="text-indigo-400 hover:bg-indigo-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleSavePropertyEdit} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Area</label><input type="text" required value={editPropertyData.name} onChange={(e)=>setEditPropertyData({...editPropertyData, name: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"/></div><div><label className="text-sm font-bold text-gray-700 block mb-2">Alamat</label><textarea required value={editPropertyData.address} onChange={(e)=>setEditPropertyData({...editPropertyData, address: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-indigo-500"></textarea></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setEditPropertyModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md transition">Simpan Perubahan</button></div></form></div></div>)}
        {isWaModalOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] shadow-2xl w-[calc(100%-1rem)] sm:w-full max-w-sm overflow-hidden animate-in zoom-in-95 flex flex-col"><div className="p-5 sm:p-6 border-b border-green-100 flex justify-between items-center bg-green-50/50 flex-shrink-0"><h3 className="font-extrabold text-lg text-green-700 flex items-center"><MessageCircle size={20} className="mr-2"/> Hubungi Kami</h3><button onClick={() => setIsWaModalOpen(false)} className="text-green-500 hover:bg-green-100 p-1.5 rounded-lg transition"><X size={20}/></button></div><form onSubmit={handleSendWaInquiry} className="flex flex-col flex-1 min-h-0"><div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar"><p className="text-sm text-gray-600 font-medium">Sistem akan mengarahkan Anda ke WhatsApp untuk menanyakan ketersediaan kos.</p><div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Panggilan Anda</label><input type="text" required value={waNameInput} onChange={(e) => setWaNameInput(e.target.value)} placeholder="Contoh: Budi" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base sm:text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"/></div></div><div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 border-t border-gray-100"><button type="button" onClick={() => setIsWaModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Batal</button><button type="submit" className="w-full sm:w-auto px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-green-200/50 flex items-center justify-center transition"><MessageCircle size={18} className="mr-2" /> Kirim WhatsApp</button></div></form></div></div>)}
      </div>

      {/* --- PRINT ONLY LAYOUTS --- */}
      {receiptModal.isOpen && receiptModal.data && (() => {
        const trx = receiptModal.data;
        const tenant = allTenants.find(t => String(t.id) === String(trx.tenantId));
        const room = allRooms.find(r => String(r.id) === String(trx.roomId));
        const property = properties.find(p => String(p.id) === String(trx.propertyId));

        return (
          <div className="hidden print:block w-full font-sans text-black bg-white">
            <div className="border-b-2 border-black pb-6 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black uppercase mb-1">BUKTI PEMBAYARAN KOS</h1>
                <h2 className="text-xl font-bold">{siteSettings.appName} {property ? `- ${property.name}` : ''}</h2>
                {property?.address && <p className="text-sm text-gray-600 mt-1">{property.address}</p>}
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-black text-gray-800 tracking-widest">LUNAS</h3>
                <p className="text-sm font-bold text-gray-600 mt-1">INV-{trx.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Diterima dari:</p>
                <p className="font-bold text-lg">{tenant ? tenant.name : 'Penghuni'}</p>
                <p className="text-gray-600 mt-1">Penyewa Unit {room ? room.number : '-'}</p>
                <p className="text-gray-600">{tenant?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 mb-1">Detail Pembayaran:</p>
                <p><span className="font-medium mr-2">Tanggal Bayar:</span> <span className="font-bold">{trx.date || '-'}</span></p>
                <p><span className="font-medium mr-2">Periode Tagihan:</span> <span className="font-bold">{trx.month}</span></p>
                <p><span className="font-medium mr-2">Metode:</span> <span className="font-bold uppercase">{trx.type || 'Transfer'}</span></p>
              </div>
            </div>

            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-y-2 border-black">
                  <th className="py-3 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Keterangan</th>
                  <th className="py-3 text-right font-bold text-gray-700 uppercase text-xs tracking-wider">Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-5">
                    <p className="font-bold text-base">Pembayaran Sewa Kamar {room ? room.number : '-'}</p>
                    <p className="text-sm text-gray-500 mt-1">Tipe Unit: {room ? room.type : '-'}</p>
                  </td>
                  <td className="py-5 text-right font-bold text-lg">
                    {formatRupiah(trx.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-4 text-right font-black text-xl uppercase pr-6">Total Pembayaran</td>
                  <td className="py-4 text-right font-black text-2xl">{formatRupiah(trx.amount)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p className="font-bold text-gray-800 mb-1">Terima kasih atas pembayaran Anda.</p>
              <p>Struk ini merupakan bukti pembayaran yang sah dan dicetak secara otomatis oleh sistem.</p>
            </div>
          </div>
        );
      })()}

      {isReportModalOpen && isOwner && (
        <div className="hidden print:block w-full font-sans text-black bg-white">
          <div className="text-center mb-10 border-b-2 border-black pb-6">
            <h1 className="text-3xl font-black uppercase mb-2">LAPORAN KEUANGAN KOS</h1>
            <h2 className="text-xl font-bold text-gray-800">{siteSettings.appName}</h2>
            <p className="text-sm text-gray-500 mt-2">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')} | Status: {financeFilter === 'all' ? 'Semua Status' : financeFilter === 'paid' ? 'Lunas' : financeFilter === 'pending' ? 'Verifikasi' : 'Belum Lunas'}</p>
          </div>
          
          {properties.map(prop => {
            const propMonthly = {};
            allTransactions.filter(t => String(t.propertyId) === String(prop.id) && (financeFilter === 'all' || String(t.status) === financeFilter)).forEach(trx => { propMonthly[trx.month] = (propMonthly[trx.month] || 0) + Number(trx.amount); });
            const propTotal = Object.values(propMonthly).reduce((a,b)=>a+b, 0);
            
            if(Object.keys(propMonthly).length === 0) return null;

            return (
              <div key={prop.id} className="mb-8 break-inside-avoid">
                <h3 className="font-bold text-lg border-b border-gray-400 pb-2 mb-4">{prop.name} <span className="text-sm font-normal text-gray-600">- {prop.address}</span></h3>
                <table className="w-full text-left mb-2 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-sm font-bold border-b border-gray-300">Bulan Tagihan</th>
                      <th className="py-2 px-4 text-sm font-bold border-b border-gray-300 text-right">Total Pemasukan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(propMonthly).map(month => (
                      <tr key={month}>
                        <td className="py-2 px-4 text-sm border-b border-gray-200">{month}</td>
                        <td className="py-2 px-4 text-sm font-bold text-right border-b border-gray-200">{formatRupiah(propMonthly[month])}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="py-3 px-4 text-sm font-bold text-right uppercase">Subtotal Area:</td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-lg">{formatRupiah(propTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}

          <div className="mt-12 border-t-4 border-black pt-6 flex justify-between items-center break-inside-avoid">
            <h3 className="text-xl font-black uppercase">Grand Total Keseluruhan</h3>
            <p className="text-3xl font-black">{formatRupiah(allTransactions.filter(t => financeFilter === 'all' || String(t.status) === financeFilter).reduce((acc, curr) => acc + Number(curr.amount), 0))}</p>
          </div>
        </div>
      )}
    </>
  );
}