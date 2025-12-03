'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMenu } from '@/context/MenuContext';
import { MenuItem, CATEGORIES, Order } from '@/types';
import { Trash2, Plus, Edit2, QrCode, LogOut, Save, Link as LinkIcon, Upload, CheckCircle, Clock, XCircle, LayoutDashboard, Coffee, DollarSign, TrendingUp, Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatToman, toPersianDigits } from '@/utils/format';
import { getStats } from '@/services/dbService';

export default function AdminPage() {
  const { items, orders, addItem, updateItem, deleteItem, updateOrderStatus, isAuthenticated, logout, qrCodeUrl, updateQrCodeUrl } = useMenu();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'orders'>('dashboard');
  const [stats, setStats] = useState({ visits: 0, totalSales: 0, ordersCount: 0 });
  
  // Menu Editing State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: 'اسپرسو',
    available: true,
    imageUrl: ''
  });

  const [localQrUrl, setLocalQrUrl] = useState(qrCodeUrl);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
        // Fetch stats when authenticated
        getStats().then((data) => setStats(data as any));
    }
  }, [isAuthenticated, router, activeTab]);

  useEffect(() => {
    setLocalQrUrl(qrCodeUrl);
  }, [qrCodeUrl]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleQrSave = () => {
    updateQrCodeUrl(localQrUrl);
    alert('لینک QR Code فوتر با موفقیت بروزرسانی شد.');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if (isEditing) {
            await updateItem(isEditing, formData, imageFile || undefined);
            setIsEditing(null);
        } else {
            await addItem(formData, imageFile || undefined);
        }
        // Reset form
        setFormData({
            name: '',
            description: '',
            price: 0,
            category: 'اسپرسو',
            available: true,
            imageUrl: ''
        });
        setImageFile(null);
    } catch (error) {
        alert("خطا در ذخیره سازی");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setIsEditing(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      imageUrl: item.imageUrl
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این آیتم اطمینان دارید؟')) {
      await deleteItem(id);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="font-serif text-3xl text-white font-bold">پنل مدیریت کافه واژه</h1>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-lg transition-colors font-bold ${activeTab === 'dashboard' ? 'bg-coffee-600 text-white' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
            >
                <LayoutDashboard size={18} /> داشبورد
            </button>
            <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-lg transition-colors font-bold ${activeTab === 'orders' ? 'bg-coffee-600 text-white' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
            >
                <Clock size={18} /> سفارشات ({toPersianDigits(orders.filter(o => o.status === 'pending').length)})
            </button>
            <button 
                onClick={() => setActiveTab('menu')}
                className={`flex items-center gap-2 whitespace-nowrap px-6 py-2 rounded-lg transition-colors font-bold ${activeTab === 'menu' ? 'bg-coffee-600 text-white' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
            >
                <Coffee size={18} /> مدیریت منو
            </button>
            <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-900/50 hover:bg-red-900 text-red-100 rounded-lg transition-colors"
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 p-6 rounded-2xl border border-white/5 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-900/30 text-green-500 flex items-center justify-center">
                      <DollarSign size={24} />
                  </div>
                  <div>
                      <p className="text-gray-400 text-sm mb-1">فروش کل</p>
                      <h3 className="text-2xl font-bold text-white font-serif">{formatToman(stats.totalSales)}</h3>
                  </div>
              </div>

              <div className="bg-neutral-900 p-6 rounded-2xl border border-white/5 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-900/30 text-blue-500 flex items-center justify-center">
                      <TrendingUp size={24} />
                  </div>
                  <div>
                      <p className="text-gray-400 text-sm mb-1">تعداد سفارشات</p>
                      <h3 className="text-2xl font-bold text-white font-serif">{toPersianDigits(stats.ordersCount)} سفارش</h3>
                  </div>
              </div>

              <div className="bg-neutral-900 p-6 rounded-2xl border border-white/5 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-900/30 text-purple-500 flex items-center justify-center">
                      <Users size={24} />
                  </div>
                  <div>
                      <p className="text-gray-400 text-sm mb-1">بازدید سایت</p>
                      <h3 className="text-2xl font-bold text-white font-serif">{toPersianDigits(stats.visits)} بازدید</h3>
                  </div>
              </div>
           </div>

           {/* Recent Activity / Pending Orders Preview */}
           <div className="bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                   <h3 className="font-bold text-white">سفارشات اخیر</h3>
                   <button onClick={() => setActiveTab('orders')} className="text-sm text-coffee-400 hover:text-coffee-300">مشاهده همه</button>
               </div>
               <div className="divide-y divide-white/5">
                   {orders.slice(0, 5).map(order => (
                       <div key={order.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-4">
                               <span className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-yellow-500' : order.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                               <span className="text-white font-medium">{order.items.map(i => i.name).join(', ')}</span>
                           </div>
                           <div className="text-gray-400 text-sm">
                               {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                           </div>
                       </div>
                   ))}
                   {orders.length === 0 && <div className="p-8 text-center text-gray-500">سفارشی وجود ندارد.</div>}
               </div>
           </div>
        </div>
      )}

      {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl text-white font-bold mb-4">مدیریت سفارشات</h2>
              <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                  {orders.length === 0 ? (
                       <div className="p-12 text-center text-gray-500">سفارشی یافت نشد.</div>
                  ) : (
                      <div className="divide-y divide-white/5">
                          {orders.map(order => (
                              <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-3">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                              order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                              'bg-red-500/20 text-red-500'
                                          }`}>
                                              {order.status === 'pending' ? 'در انتظار' : order.status === 'completed' ? 'تکمیل شده' : 'لغو شده'}
                                          </span>
                                          <span className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString('fa-IR')}</span>
                                      </div>
                                      <div className="text-white font-bold text-lg">
                                          {order.items.map(i => `${toPersianDigits(i.quantity)}x ${i.name}`).join('، ')}
                                      </div>
                                      <div className="text-coffee-400 font-mono">
                                          مجموع: {formatToman(order.totalAmount)}
                                      </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      {order.status === 'pending' && (
                                          <>
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                                className="p-2 bg-green-900/30 hover:bg-green-700 text-green-200 rounded-lg transition-colors border border-green-900/50 flex items-center gap-2"
                                            >
                                                <CheckCircle size={18}/> تکمیل
                                            </button>
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                className="p-2 bg-red-900/30 hover:bg-red-700 text-red-200 rounded-lg transition-colors border border-red-900/50 flex items-center gap-2"
                                            >
                                                <XCircle size={18}/> لغو
                                            </button>
                                          </>
                                      )}
                                      {order.status !== 'pending' && (
                                           <span className="text-gray-600 italic text-sm">وضعیت تغییر یافته</span>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'menu' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* QR Code Section */}
      <div className="flex gap-4 mb-8">
           <button 
                onClick={() => setShowQR(!showQR)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-white/10"
            >
                <QrCode size={18} /> {showQR ? 'مخفی کردن QR' : 'کد QR منو'}
            </button>
      </div>

      {showQR && (
          <div className="mb-12 p-8 bg-white rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4">
              <h3 className="text-black font-serif text-2xl mb-4 font-bold">اسکن برای منوی کافه واژه</h3>
              <div className="p-4 border-4 border-black rounded-xl mb-4 bg-white shadow-xl">
                <QRCodeCanvas 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu`} 
                    size={256}
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                        src: "https://via.placeholder.com/40/000000/FFFFFF?text=VAJE",
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
              </div>
              <p className="text-gray-600 font-sans text-lg dir-ltr">vaje.cafe/menu</p>
          </div>
      )}

      {/* Footer Settings */}
      <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl shadow-lg shadow-black/20 mb-8">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <LinkIcon size={18} className="text-coffee-500" />
            تنظیمات QR Code فوتر
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
              <input 
                  type="text" 
                  value={localQrUrl}
                  onChange={(e) => setLocalQrUrl(e.target.value)}
                  className="flex-grow bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white dir-ltr text-left placeholder-gray-600 focus:outline-none focus:border-coffee-500 transition-colors"
              />
              <button 
                onClick={handleQrSave}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-coffee-600 hover:bg-coffee-500 text-white rounded-lg transition-colors font-medium"
              >
                  <Save size={18} />
                  ذخیره
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl sticky top-28 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {isEditing ? <Edit2 size={20} className="text-coffee-500"/> : <Plus size={20} className="text-coffee-500"/>}
              {isEditing ? 'ویرایش آیتم' : 'افزودن آیتم جدید'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">نام آیتم</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-coffee-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">توضیحات</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-coffee-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">قیمت (تومان)</label>
                  <input
                    required
                    type="number"
                    step="1000"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-coffee-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">دسته‌بندی</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-coffee-500 focus:outline-none transition-colors"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">تصویر</label>
                <div className="space-y-2">
                    {/* Link Input */}
                    <input
                      type="text"
                      value={formData.imageUrl || ''}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="لینک تصویر (اختیاری)"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-coffee-500 focus:outline-none dir-ltr text-right"
                    />
                    <div className="text-center text-gray-500 text-xs">یا آپلود فایل</div>
                    {/* File Input */}
                    <div className="relative border border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-coffee-500 transition-colors bg-neutral-950">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2">
                            <Upload size={20} className="text-gray-400" />
                            <span className="text-xs text-gray-400">
                                {imageFile ? imageFile.name : 'انتخاب تصویر از دستگاه'}
                            </span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={e => setFormData({...formData, available: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 text-coffee-600 focus:ring-coffee-500 bg-neutral-900"
                />
                <label htmlFor="available" className="text-sm text-gray-300 cursor-pointer">موجود برای سفارش</label>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ذخیره...' : (isEditing ? 'بروزرسانی' : 'افزودن به منو')}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                        setIsEditing(null);
                        setFormData({
                            name: '',
                            description: '',
                            price: 0,
                            category: 'اسپرسو',
                            available: true,
                            imageUrl: ''
                        });
                        setImageFile(null);
                    }}
                    className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
             <div className="px-6 py-5 border-b border-white/5 bg-neutral-900/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-300 text-lg">آیتم‌های منو ({toPersianDigits(items.length)})</h3>
             </div>
             <div className="divide-y divide-white/5">
                {items.length === 0 && (
                    <div className="p-12 text-center text-gray-500 text-lg">هنوز آیتمی به منو اضافه نشده است.</div>
                )}
                {items.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                        <img 
                            src={item.imageUrl || `https://picsum.photos/100/100?random=${item.id}`} 
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover bg-neutral-800" 
                        />
                        <div className="flex-grow">
                            <div className="flex items-baseline justify-between mb-2">
                                <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                <span className="text-coffee-400 font-mono text-lg font-bold">{formatToman(item.price)}</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1 mb-2 leading-6">{item.description}</p>
                            <div className="flex gap-2">
                                <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-800 text-gray-300 border border-white/5">{item.category}</span>
                                {!item.available && (
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-900/50">ناموجود</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="p-2.5 bg-neutral-800 hover:bg-coffee-600 hover:text-white text-gray-400 rounded-lg transition-colors"
                                title="ویرایش"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2.5 bg-neutral-800 hover:bg-red-600 hover:text-white text-gray-400 rounded-lg transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

      </div>
      </div>
      )}
    </div>
  );
}