'use client';

import React, { useState } from 'react';
import { useMenu } from '@/context/MenuContext';
import { CATEGORIES } from '@/types';
import { formatToman } from '@/utils/format';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function MenuPage() {
  const { items, addOrder, isLoading } = useMenu();
  const [activeCategory, setActiveCategory] = useState<string>('همه');
  const [orderingItem, setOrderingItem] = useState<string | null>(null);

  const filteredItems = activeCategory === 'همه' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const availableItems = filteredItems.filter(item => item.available);

  const handleQuickOrder = async (item: any) => {
    if (!confirm(`آیا می‌خواهید یک عدد "${item.name}" سفارش دهید؟ (این یک سفارش آزمایشی است)`)) return;
    
    setOrderingItem(item.id);
    try {
        await addOrder([{
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        }]);
        alert('سفارش شما ثبت شد! شماره میز را به گارسون اطلاع دهید.');
    } catch (e) {
        alert('خطا در ثبت سفارش');
        console.error(e);
    } finally {
        setOrderingItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950" dir="rtl">
      
      {/* Header */}
      <div className="bg-neutral-900/50 py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6 font-bold">منوی کافه واژه</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-8">
            انتخابی دقیق از بهترین طعم‌ها برای سلیقه‌های خاص.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-1/4 space-y-8">
            <div className="sticky top-28 space-y-8">
              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-coffee-100 font-bold mb-4 text-lg">دسته‌بندی‌ها</h3>
                <button
                  onClick={() => setActiveCategory('همه')}
                  className={`block w-full text-right px-4 py-3 rounded-lg transition-colors font-medium ${
                    activeCategory === 'همه' 
                      ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  همه موارد
                </button>
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`block w-full text-right px-4 py-3 rounded-lg transition-colors font-medium ${
                      activeCategory === category 
                        ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="w-full lg:w-3/4">
            {isLoading ? (
               <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-coffee-500 w-10 h-10" />
               </div>
            ) : availableItems.length === 0 ? (
              <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
                <p className="text-gray-500 text-lg">در حال حاضر آیتمی در این دسته موجود نیست.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableItems.map(item => (
                  <div 
                    key={item.id} 
                    className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-coffee-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col"
                  >
                    <div className="h-56 overflow-hidden relative w-full">
                      <img 
                        src={item.imageUrl || `https://picsum.photos/400/300?random=${item.id}`} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80"></div>
                      <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                        <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 font-medium">
                          {item.category}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleQuickOrder(item)}
                                disabled={orderingItem === item.id}
                                className="bg-coffee-600 hover:bg-coffee-500 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                            >
                                {orderingItem === item.id ? <Loader2 size={20} className="animate-spin"/> : <ShoppingBag size={20}/>}
                            </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-serif text-xl text-white group-hover:text-coffee-400 transition-colors font-bold">{item.name}</h3>
                             <span className="font-serif text-lg text-coffee-300 font-bold">
                                {formatToman(item.price)}
                             </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-7 line-clamp-3">
                            {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}