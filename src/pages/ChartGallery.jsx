import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChartGallery = ({ charts = [], onAddChart, onDeleteChart }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All'); 
  const [selectedChart, setSelectedChart] = useState(null); 

  const [formData, setFormData] = useState({
    symbol: 'BANKNIFTY',
    setupName: 'SMC - Liquidity Sweep',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '', // This will now hold the Base64 image data
    pnl: 0,
    mistakes: '',
    lessons: 'Risk management 1:1 maintained.'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🟢 NEW: Handle File Upload from Computer
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) return alert("Please select an image file from your computer.");
    
    onAddChart({
      symbol: formData.symbol.toUpperCase(),
      setupName: formData.setupName,
      date: formData.date,
      imageUrl: formData.imageUrl,
      pnl: parseFloat(formData.pnl) || 0,
      mistakes: formData.mistakes,
      lessons: formData.lessons
    });
    
    setShowForm(false);
    setFormData(prev => ({ ...prev, imageUrl: '', pnl: 0, mistakes: '', lessons: '' }));
  };

  const filteredCharts = charts.filter(chart => {
    if (filter === 'Winners') return chart.pnl > 0;
    if (filter === 'Losers') return chart.pnl <= 0;
    if (filter === 'SMC') return chart.setupName.toLowerCase().includes('smc');
    return true; 
  });

  const styles = {
    container: { backgroundColor: '#191919', color: '#E0E0E0', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
    addButton: { backgroundColor: '#2D9CDB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' },
    formContainer: { backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', color: '#9B9A97', fontWeight: 'bold', textTransform: 'uppercase' },
    input: { backgroundColor: '#191919', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', outline: 'none' },
    submitButton: { backgroundColor: '#219653', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%' },
    filterBar: { display: 'flex', gap: '10px', marginBottom: '20px' },
    filterBtn: (isActive) => ({ backgroundColor: isActive ? 'rgba(45, 156, 219, 0.2)' : 'transparent', color: isActive ? '#2D9CDB' : '#9B9A97', border: isActive ? '1px solid rgba(45, 156, 219, 0.5)' : '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }),
    masonryGrid: { columnCount: 3, columnGap: '20px' },
    masonryItem: { breakInside: 'avoid', marginBottom: '20px', position: 'relative', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: '#262626', border: '1px solid rgba(255,255,255,0.05)' },
    image: { width: '100%', display: 'block', objectFit: 'cover' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '30px 15px 15px 15px', color: '#FFF' },
    lightboxOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', backdropFilter: 'blur(5px)' },
    lightboxImageContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
    lightboxImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
    lightboxPanel: { width: '400px', backgroundColor: '#191919', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '30px', overflowY: 'auto' },
    closeBtn: { position: 'absolute', top: '20px', right: '420px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
    deleteBtn: { backgroundColor: 'transparent', color: '#EB5757', border: '1px solid rgba(235, 87, 87, 0.4)', borderRadius: '4px', cursor: 'pointer', padding: '8px 12px', fontSize: '14px', fontWeight: 'bold', width: '100%', marginTop: 'auto', transition: 'all 0.2s' }
  };

  return (
    <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      
      <div style={styles.header}>
        <h1 style={styles.title}>🖼️ CHART GALLERY</h1>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '➕ Upload New Chart'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={styles.formContainer}
            onSubmit={handleSubmit}
          >
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Symbol</label>
                <input style={styles.input} name="symbol" value={formData.symbol} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Setup / Model Name</label>
                <input style={styles.input} name="setupName" value={formData.setupName} onChange={handleChange} placeholder="e.g. SMC FVG" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date Executed</label>
                <input style={styles.input} type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Profit / Loss ($)</label>
                <input style={styles.input} type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} required />
              </div>
              
              {/* 🟢 FIXED: File Upload Input instead of URL Text Input */}
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Upload Chart Image (From Computer)</label>
                <input style={{...styles.input, padding: '8px', cursor: 'pointer'}} type="file" accept="image/*" onChange={handleImageUpload} required />
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" style={{ marginTop: '10px', height: '100px', objectFit: 'contain', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', alignSelf: 'flex-start' }} />
                )}
              </div>

              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>What went wrong? (Mistakes)</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} name="mistakes" value={formData.mistakes} onChange={handleChange} placeholder="Early entry, ignored trend..." />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>What went right? (Lessons)</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} name="lessons" value={formData.lessons} onChange={handleChange} placeholder="Followed plan perfectly..." />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Save Chart to Gallery</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.filterBar}>
        {['All', 'Winners', 'Losers', 'SMC'].map(f => (
          <button key={f} style={styles.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {filteredCharts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9B9A97', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          No charts found. Upload a screenshot to build your visual journal!
        </div>
      ) : (
        <div style={styles.masonryGrid}>
          {filteredCharts.map((chart) => (
            <motion.div 
              key={chart.id} 
              style={styles.masonryItem}
              whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedChart(chart)}
            >
              <img src={chart.imageUrl} alt={chart.symbol} style={styles.image} loading="lazy" />
              <div style={styles.imageOverlay}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#FFF' }}>{chart.symbol}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: chart.pnl >= 0 ? '#219653' : '#EB5757' }}>
                    ${chart.pnl}
                  </span>
                </div>
                <div style={{ color: '#9B9A97', fontSize: '0.8rem' }}>{chart.setupName || 'Manual Trade'} • {new Date(chart.date).toLocaleDateString()}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedChart && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={styles.lightboxOverlay}
          >
            <button style={styles.closeBtn} onClick={() => setSelectedChart(null)}>✕</button>
            
            <div style={styles.lightboxImageContainer} onClick={() => setSelectedChart(null)}>
              <img src={selectedChart.imageUrl} alt="Trade Chart Fullscreen" style={styles.lightboxImage} onClick={(e) => e.stopPropagation()} />
            </div>

            <motion.div 
              initial={{ x: 400 }} 
              animate={{ x: 0 }} 
              exit={{ x: 400 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.lightboxPanel}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ color: '#FFFFFF', margin: '0 0 5px 0', fontSize: '28px' }}>{selectedChart.symbol}</h2>
                  <div style={{ color: '#9B9A97', fontSize: '14px' }}>{new Date(selectedChart.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div style={{ background: selectedChart.pnl >= 0 ? 'rgba(33, 150, 83, 0.2)' : 'rgba(235, 87, 87, 0.2)', color: selectedChart.pnl >= 0 ? '#219653' : '#EB5757', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
                  ${selectedChart.pnl}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ color: '#9B9A97', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Model / Setup</div>
                <div style={{ color: '#2D9CDB', fontWeight: 'bold', fontSize: '16px' }}>{selectedChart.setupName || 'Manual Execution'}</div>
              </div>

              {selectedChart.mistakes && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#EB5757', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>❌ What went wrong</div>
                  <p style={{ color: '#E0E0E0', fontSize: '14px', lineHeight: '1.5', margin: 0, padding: '12px', background: 'rgba(235, 87, 87, 0.05)', borderLeft: '3px solid #EB5757', borderRadius: '0 6px 6px 0' }}>
                    {selectedChart.mistakes}
                  </p>
                </div>
              )}

              {selectedChart.lessons && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ color: '#219653', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>✅ Lessons Learned</div>
                  <p style={{ color: '#E0E0E0', fontSize: '14px', lineHeight: '1.5', margin: 0, padding: '12px', background: 'rgba(33, 150, 83, 0.05)', borderLeft: '3px solid #219653', borderRadius: '0 6px 6px 0' }}>
                    {selectedChart.lessons}
                  </p>
                </div>
              )}

              <button 
                style={styles.deleteBtn} 
                onClick={() => {
                  onDeleteChart(selectedChart.id);
                  setSelectedChart(null);
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(235, 87, 87, 0.1)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                Delete Chart Record
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ChartGallery;