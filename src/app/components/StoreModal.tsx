import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import IconPicker from './IconPicker';

interface StoreItem {
  id: string;
  name: string;
  icon: string;
  badgesRequired: number;
  stock: number;
}

interface ExchangeRecord {
  id: string;
  studentName: string;
  itemName: string;
  itemIcon: string;
  badgesUsed: number;
  timestamp: number;
}

interface Student {
  id: string;
  name: string;
  badges?: number;
}

interface StoreModalProps {
  students: Student[];
  onClose: () => void;
  onUpdateStudent?: (studentId: string, badges: number) => void;
}

export default function StoreModal({ students, onClose, onUpdateStudent }: StoreModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'store' | 'manage' | 'history'>('store');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [exchangingItem, setExchangingItem] = useState<StoreItem | null>(null);

  const [storeItems, setStoreItems] = useState<StoreItem[]>([
    { id: '1', name: '座位券', icon: '🪑', badgesRequired: 3, stock: 10 },
    { id: '2', name: '小零食券', icon: '🍪', badgesRequired: 2, stock: 20 },
    { id: '3', name: '免作业卡', icon: '📝', badgesRequired: 5, stock: 5 },
    { id: '4', name: '优先发言权', icon: '🎤', badgesRequired: 2, stock: 15 },
    { id: '5', name: '课间加时卡', icon: '⏰', badgesRequired: 3, stock: 8 },
    { id: '6', name: '小礼物', icon: '🎁', badgesRequired: 4, stock: 12 },
  ]);

  const [exchangeHistory] = useState<ExchangeRecord[]>([
    { id: '1', studentName: '张小明', itemName: '座位券', itemIcon: '🪑', badgesUsed: 3, timestamp: Date.now() - 86400000 },
    { id: '2', studentName: '李晓红', itemName: '小零食券', itemIcon: '🍪', badgesUsed: 2, timestamp: Date.now() - 172800000 },
    { id: '3', studentName: '王大伟', itemName: '免作业卡', itemIcon: '📝', badgesUsed: 5, timestamp: Date.now() - 259200000 },
  ]);

  const [newItem, setNewItem] = useState<Omit<StoreItem, 'id'>>({
    name: '',
    icon: '🎁',
    badgesRequired: 1,
    stock: 10
  });

  const handleExchange = (item: StoreItem) => {
    setExchangingItem(item);
  };

  const handleConfirmExchange = (student: Student, item: StoreItem) => {
    // Update stock
    setStoreItems(storeItems.map(i =>
      i.id === item.id ? { ...i, stock: i.stock - 1 } : i
    ));

    // Deduct badges from student
    const newBadgeCount = (student.badges || 0) - item.badgesRequired;
    if (onUpdateStudent) {
      onUpdateStudent(student.id, newBadgeCount);
    }

    // TODO: Add to exchange history

    setExchangingItem(null);
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    const item: StoreItem = {
      id: crypto.randomUUID(),
      ...newItem
    };

    setStoreItems([...storeItems, item]);
    setNewItem({ name: '', icon: '🎁', badgesRequired: 1, stock: 10 });
  };

  const handleEditItem = (item: StoreItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    setStoreItems(storeItems.map(item =>
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setStoreItems(storeItems.filter(item => item.id !== id));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-card-foreground">{t('store.title')}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('store')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'store'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('store.storeTab')}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'manage'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('store.manageTab')}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('store.historyTab')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'store' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/30 rounded-[var(--radius-xl)] p-5 hover:bg-muted/50 transition-all border border-border"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl">{item.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-card-foreground font-medium mb-1">{item.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            {item.badgesRequired}
                          </span>
                          <span>·</span>
                          <span>{t('store.stock')}: {item.stock}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchange(item)}
                      disabled={item.stock === 0}
                      className={`w-full py-2.5 rounded-[var(--radius-lg)] text-white font-medium transition-all ${
                        item.stock === 0
                          ? 'bg-border cursor-not-allowed opacity-50'
                          : 'hover:opacity-90'
                      }`}
                      style={{
                        background: item.stock > 0 ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' : undefined
                      }}
                    >
                      {item.stock > 0 ? t('store.exchange') : t('store.outOfStock')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-6">
                {/* Add New Item */}
                <div className="bg-muted/30 rounded-[var(--radius-xl)] p-5 border border-border">
                  <h3 className="text-card-foreground font-medium mb-4">{t('store.addNewItem')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-card-foreground mb-2">{t('store.itemIcon')}</label>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setShowIconPicker(true);
                        }}
                        className="w-20 h-20 rounded-[var(--radius-lg)] bg-muted hover:bg-border transition-colors flex items-center justify-center text-4xl"
                      >
                        {newItem.icon}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-card-foreground mb-2">{t('store.itemName')}</label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder={t('store.itemNamePlaceholder')}
                        className="w-full px-4 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-card-foreground mb-2">{t('store.badgesRequired')}</label>
                      <input
                        type="number"
                        min="1"
                        value={newItem.badgesRequired}
                        onChange={(e) => setNewItem({ ...newItem, badgesRequired: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-4 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-card-foreground mb-2">{t('store.stock')}</label>
                      <input
                        type="number"
                        min="0"
                        value={newItem.stock}
                        onChange={(e) => setNewItem({ ...newItem, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-4 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="mt-4 px-6 py-2.5 rounded-[var(--radius-lg)] text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' }}
                  >
                    {t('store.addItem')}
                  </button>
                </div>

                {/* Existing Items */}
                <div className="space-y-3">
                  <h3 className="text-card-foreground font-medium">{t('store.existingItems')}</h3>
                  {storeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-[var(--radius-lg)] border border-border"
                    >
                      <div className="text-3xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="text-card-foreground font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.badgesRequired} {t('store.badges')} · {t('store.stock')}: {item.stock}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="w-9 h-9 rounded-[var(--radius-md)] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-9 h-9 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {exchangeHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('store.noHistory')}
                  </div>
                ) : (
                  exchangeHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-[var(--radius-lg)] border border-border"
                    >
                      <div className="text-3xl">{record.itemIcon}</div>
                      <div className="flex-1">
                        <div className="text-card-foreground font-medium">{record.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('store.exchanged')} {record.itemName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[var(--accent)] font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                          -{record.badgesUsed}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(record.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          currentIcon={editingItem ? editingItem.icon : newItem.icon}
          onSelect={(icon) => {
            if (editingItem) {
              setEditingItem({ ...editingItem, icon });
            } else {
              setNewItem({ ...newItem, icon });
            }
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setEditingItem(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-card-foreground font-medium">{t('store.editItem')}</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-card-foreground mb-2">{t('store.itemIcon')}</label>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className="w-20 h-20 rounded-[var(--radius-lg)] bg-muted hover:bg-border transition-colors flex items-center justify-center text-4xl"
                  >
                    {editingItem.icon}
                  </button>
                </div>
                <div>
                  <label className="block text-sm text-card-foreground mb-2">{t('store.itemName')}</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-card-foreground mb-2">{t('store.badgesRequired')}</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.badgesRequired}
                    onChange={(e) => setEditingItem({ ...editingItem, badgesRequired: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-card-foreground mb-2">{t('store.stock')}</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' }}
                >
                  {t('settings.groups.save')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Student Selection Modal */}
      {exchangingItem && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setExchangingItem(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-card-foreground font-medium mb-1">
                    {t('store.selectStudent')}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{exchangingItem.name}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                      {exchangingItem.badgesRequired}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExchangingItem(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('store.noStudents')}
                  </div>
                ) : (
                  students.map((student) => {
                    const badges = student.badges || 0;
                    const canExchange = badges >= exchangingItem.badgesRequired;

                    return (
                      <button
                        key={student.id}
                        onClick={() => canExchange && handleConfirmExchange(student, exchangingItem)}
                        disabled={!canExchange}
                        className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-lg)] transition-all ${
                          canExchange
                            ? 'bg-muted/30 hover:bg-muted/50 border border-border cursor-pointer'
                            : 'bg-muted/10 border border-border/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                            canExchange
                              ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-medium ${canExchange ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                            {student.name}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <svg className={`w-3.5 h-3.5 ${canExchange ? 'text-[var(--accent)]' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            <span className={canExchange ? 'text-muted-foreground' : 'text-muted-foreground/70'}>
                              {badges}
                            </span>
                          </div>
                        </div>
                        {!canExchange && (
                          <span className="text-xs text-destructive px-2 py-1 bg-destructive/10 rounded-full">
                            {t('store.insufficient')}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
