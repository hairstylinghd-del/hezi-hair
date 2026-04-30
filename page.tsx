'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string; first_name: string; last_name: string
  phone: string; email: string; notes: string; status: string
}
type Service = {
  id: string; name: string; price: number; duration: number; icon: string
}
type Appointment = {
  id: string; client_id: string; service_id: string
  scheduled_at: string; status: string; notes: string; reminder_sent: string
  clients?: Client; services?: Service
}

export default function Home() {
  const [page, setPage] = useState('dashboard')
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [modal, setModal] = useState('')
  const [search, setSearch] = useState('')
  const [bizOpen, setBizOpen] = useState(true)
  const [toast, setToast] = useState('')

  // New appointment form
  const [apptClient, setApptClient] = useState('')
  const [apptService, setApptService] = useState('')
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0])
  const [apptTime, setApptTime] = useState('10:00')
  const [apptNotes, setApptNotes] = useState('')

  // New client form
  const [cFname, setCFname] = useState('')
  const [cLname, setCLname] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')

  // New service form
  const [sName, setSName] = useState('')
  const [sPrice, setSPrice] = useState('')
  const [sDuration, setSDuration] = useState('')
  const [sIcon, setSIcon] = useState('✂️')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = useCallback(async () => {
    const [c, s, a] = await Promise.all([
      supabase.from('clients').select('*').order('first_name'),
      supabase.from('services').select('*').order('name'),
      supabase.from('appointments').select('*, clients(*), services(*)').order('scheduled_at'),
    ])
    if (c.data) setClients(c.data)
    if (s.data) setServices(s.data)
    if (a.data) setAppointments(a.data)
  }, [])

  useEffect(() => {
    loadData()

    // Realtime subscription
    const channel = supabase
      .channel('all-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.scheduled_at?.startsWith(today))

  const saveAppointment = async () => {
    if (!apptClient || !apptService || !apptDate || !apptTime) {
      showToast('❌ יש למלא את כל השדות'); return
    }
    const scheduled_at = `${apptDate}T${apptTime}:00`
    const { error } = await supabase.from('appointments').insert({
      client_id: apptClient, service_id: apptService,
      scheduled_at, notes: apptNotes, status: 'confirmed', reminder_sent: 'none'
    })
    if (error) { showToast('❌ שגיאה בשמירה'); return }
    showToast('✅ התור נשמר!')
    setModal('')
    setApptClient(''); setApptService(''); setApptNotes('')
    loadData()
  }

  const saveClient = async () => {
    if (!cFname || !cPhone) { showToast('❌ יש למלא שם וטלפון'); return }
    const { error } = await supabase.from('clients').insert({
      first_name: cFname, last_name: cLname, phone: cPhone, email: cEmail, status: 'new'
    })
    if (error) { showToast('❌ שגיאה בשמירה'); return }
    showToast('✅ לקוח נוסף!')
    setModal('')
    setCFname(''); setCLname(''); setCPhone(''); setCEmail('')
    loadData()
  }

  const saveService = async () => {
    if (!sName || !sPrice || !sDuration) { showToast('❌ יש למלא את כל השדות'); return }
    const { error } = await supabase.from('services').insert({
      name: sName, price: parseInt(sPrice), duration: parseInt(sDuration), icon: sIcon
    })
    if (error) { showToast('❌ שגיאה בשמירה'); return }
    showToast('✅ שירות נוסף!')
    setModal('')
    setSName(''); setSPrice(''); setSDuration(''); setSIcon('✂️')
    loadData()
  }

  const deleteAppointment = async (id: string) => {
    await supabase.from('appointments').delete().eq('id', id)
    showToast('🗑 תור נמחק')
    loadData()
  }

  const avatarColor = (name: string) => {
    const colors = ['#7c6aff','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899']
    let h = 0
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
    return colors[h]
  }

  const initials = (fname: string, lname: string) =>
    (fname?.[0] || '') + (lname?.[0] || '')

  const formatTime = (dt: string) =>
    new Date(dt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })

  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone}`.includes(search)
  )

  const s: Record<string, React.CSSProperties> = {
    app: { display:'flex', minHeight:'100vh', fontFamily:"'Heebo',sans-serif" },
    sidebar: { width:200, background:'#16161a', borderLeft:'1px solid #2e2e38', display:'flex', flexDirection:'column', padding:'20px 0', position:'fixed', right:0, top:0, bottom:0, zIndex:100 },
    logo: { padding:'0 20px 24px', display:'flex', alignItems:'center', gap:10 },
    logoIcon: { width:34, height:34, background:'linear-gradient(135deg,#7c6aff,#a78bfa)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'white' },
    logoText: { fontSize:17, fontWeight:800, color:'#f0f0f5' },
    nav: { padding:'0 10px', flex:1 },
    navLabel: { fontSize:10, fontWeight:700, letterSpacing:2, color:'#5a5a6e', textTransform:'uppercase', padding:'14px 12px 6px' },
    navItem: (active: boolean): React.CSSProperties => ({ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', color: active ? '#a78bfa' : '#9090a8', background: active ? 'rgba(124,106,255,0.12)' : 'transparent', fontWeight: active ? 600 : 500, fontSize:14, marginBottom:2, transition:'all 0.15s' }),
    main: { marginRight:200, flex:1, display:'flex', flexDirection:'column' },
    topbar: { background:'#16161a', borderBottom:'1px solid #2e2e38', padding:'16px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 },
    content: { padding:'24px 28px', flex:1 },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 },
    statCard: (color: string): React.CSSProperties => ({ background:'#16161a', border:'1px solid #2e2e38', borderRadius:14, padding:18 }),
    card: { background:'#16161a', border:'1px solid #2e2e38', borderRadius:14, overflow:'hidden', marginBottom:16 },
    cardHeader: { padding:'15px 18px', borderBottom:'1px solid #2e2e38', display:'flex', alignItems:'center', justifyContent:'space-between' },
    cardTitle: { fontSize:15, fontWeight:700 },
    cardBody: { padding:18 },
    btn: (variant: string): React.CSSProperties => ({ display:'inline-flex', alignItems:'center', gap:6, padding: variant==='sm' ? '6px 14px' : '9px 18px', borderRadius:8, fontSize: variant==='sm' ? 12 : 13, fontWeight:600, cursor:'pointer', border:'none', fontFamily:"'Heebo',sans-serif", background: variant==='primary' ? '#7c6aff' : '#1e1e24', color: variant==='primary' ? 'white' : '#9090a8', transition:'all 0.15s' }),
    apptItem: { display:'flex', alignItems:'center', gap:12, padding:'11px 13px', background:'#1e1e24', borderRadius:8, border:'1px solid #2e2e38', marginBottom:8 },
    avatar: (name: string): React.CSSProperties => ({ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0, background: avatarColor(name)+'22', color: avatarColor(name) }),
    badge: (type: string): React.CSSProperties => ({ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background: type==='vip' ? 'rgba(124,106,255,0.12)' : type==='new' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: type==='vip' ? '#a78bfa' : type==='new' ? '#22c55e' : '#f59e0b' }),
    input: { width:'100%', background:'#1e1e24', border:'1px solid #2e2e38', borderRadius:8, padding:'10px 14px', fontSize:14, color:'#f0f0f5', fontFamily:"'Heebo',sans-serif", outline:'none' },
    label: { fontSize:12, fontWeight:600, color:'#9090a8', marginBottom:5, display:'block', textTransform:'uppercase', letterSpacing:0.5 },
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' },
    modalBox: { background:'#16161a', border:'1px solid #2e2e38', borderRadius:14, width:460, maxWidth:'90vw', maxHeight:'85vh', overflowY:'auto' },
    modalHeader: { padding:'18px 22px', borderBottom:'1px solid #2e2e38', display:'flex', alignItems:'center', justifyContent:'space-between' },
    modalTitle: { fontSize:17, fontWeight:800 },
    modalBody: { padding:22 },
    modalFooter: { padding:'14px 22px', borderTop:'1px solid #2e2e38', display:'flex', gap:10, justifyContent:'flex-end' },
    formGroup: { marginBottom:16 },
    formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    toastBox: { position:'fixed', bottom:24, left:24, zIndex:300, background:'#16161a', border:'1px solid #2e2e38', borderRadius:8, padding:'12px 18px', fontSize:13, fontWeight:600, boxShadow:'0 4px 24px rgba(0,0,0,0.4)' },
    statusDot: (open: boolean): React.CSSProperties => ({ width:8, height:8, borderRadius:'50%', background: open ? '#22c55e' : '#ef4444', boxShadow: open ? '0 0 8px #22c55e' : 'none' }),
  }

  const Modal = ({ id, title, children, onSave }: { id: string, title: string, children: React.ReactNode, onSave: () => void }) => (
    modal === id ? (
      <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal('')}>
        <div style={s.modalBox}>
          <div style={s.modalHeader}>
            <div style={s.modalTitle}>{title}</div>
            <button onClick={() => setModal('')} style={{ ...s.btn('ghost'), padding:'4px 10px', fontSize:16 }}>✕</button>
          </div>
          <div style={s.modalBody}>{children}</div>
          <div style={s.modalFooter}>
            <button style={s.btn('ghost')} onClick={() => setModal('')}>ביטול</button>
            <button style={s.btn('primary')} onClick={onSave}>שמור</button>
          </div>
        </div>
      </div>
    ) : null
  )

  return (
    <div style={s.app}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>✂</div>
          <div style={s.logoText}>HeziCut</div>
        </div>
        <nav style={s.nav}>
          <div style={s.navLabel}>ראשי</div>
          {[
            ['dashboard','📊','לוח בקרה'],
            ['calendar','📅','יומן'],
            ['clients','👤','לקוחות'],
            ['services','✂️','שירותים'],
            ['stats','📈','סטטיסטיקה'],
          ].map(([id,icon,label]) => (
            <div key={id} style={s.navItem(page===id)} onClick={() => setPage(id)}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </nav>
        <div style={{ padding:'16px 20px 0', borderTop:'1px solid #2e2e38' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#9090a8' }}>
            <div style={s.statusDot(bizOpen)}></div>
            {bizOpen ? 'פתוח' : 'סגור'}
          </div>
          <button style={{ ...s.btn('ghost'), width:'100%', marginTop:8, justifyContent:'center' }}
            onClick={() => setBizOpen(!bizOpen)}>
            שנה סטטוס
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <div>
            <div style={{ fontSize:18, fontWeight:800 }}>
              {page==='dashboard'?'לוח בקרה':page==='calendar'?'יומן':page==='clients'?'לקוחות':page==='services'?'שירותים':'סטטיסטיקה'}
            </div>
            <div style={{ fontSize:12, color:'#9090a8', marginTop:2 }}>
              {page==='dashboard' ? `היום יש ${todayAppts.length} תורים` : ''}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {page==='clients' && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1e1e24', border:'1px solid #2e2e38', borderRadius:8, padding:'8px 14px' }}>
                <span style={{ color:'#5a5a6e' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חיפוש לקוח..."
                  style={{ background:'none', border:'none', outline:'none', color:'#f0f0f5', fontFamily:"'Heebo',sans-serif", fontSize:13, width:180 }} />
              </div>
            )}
            {(page==='dashboard'||page==='calendar') && (
              <button style={s.btn('primary')} onClick={() => setModal('appt')}>+ תור חדש</button>
            )}
            {page==='clients' && (
              <button style={s.btn('primary')} onClick={() => setModal('client')}>+ לקוח</button>
            )}
            {page==='services' && (
              <button style={s.btn('primary')} onClick={() => setModal('service')}>+ שירות</button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={s.content}>

          {/* DASHBOARD */}
          {page==='dashboard' && (
            <>
              <div style={s.statsGrid}>
                {[
                  { label:'תורים היום', value:todayAppts.length, color:'#a78bfa' },
                  { label:'הכנסה משוערת', value:`₪${todayAppts.reduce((sum,a) => sum+(a.services?.price||0),0)}`, color:'#22c55e' },
                  { label:'לקוחות', value:clients.length, color:'#f59e0b' },
                  { label:'שירותים', value:services.length, color:'#06b6d4' },
                ].map((stat,i) => (
                  <div key={i} style={s.statCard(stat.color)}>
                    <div style={{ fontSize:12, color:'#9090a8', marginBottom:8 }}>{stat.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>📅 תורים להיום</div>
                </div>
                <div style={s.cardBody}>
                  {todayAppts.length === 0 ? (
                    <div style={{ textAlign:'center', padding:24, color:'#5a5a6e' }}>אין תורים להיום</div>
                  ) : (
                    todayAppts.sort((a,b) => a.scheduled_at.localeCompare(b.scheduled_at)).map(a => (
                      <div key={a.id} style={s.apptItem}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#a78bfa', minWidth:44 }}>{formatTime(a.scheduled_at)}</div>
                        <div style={s.avatar(`${a.clients?.first_name||''}`)}>
                          {initials(a.clients?.first_name||'', a.clients?.last_name||'')}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{a.clients?.first_name} {a.clients?.last_name}</div>
                          <div style={{ fontSize:12, color:'#9090a8' }}>{a.services?.icon} {a.services?.name}</div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#22c55e' }}>₪{a.services?.price}</div>
                        <button onClick={() => deleteAppointment(a.id)}
                          style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:6, color:'#ef4444', padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
                          מחק
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* CALENDAR */}
          {page==='calendar' && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>📅 כל התורים הקרובים</div>
              </div>
              <div style={s.cardBody}>
                {appointments.filter(a => new Date(a.scheduled_at) >= new Date()).length === 0 ? (
                  <div style={{ textAlign:'center', padding:24, color:'#5a5a6e' }}>אין תורים קרובים</div>
                ) : (
                  appointments
                    .filter(a => new Date(a.scheduled_at) >= new Date())
                    .sort((a,b) => a.scheduled_at.localeCompare(b.scheduled_at))
                    .map(a => (
                      <div key={a.id} style={s.apptItem}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#a78bfa', minWidth:70, textAlign:'center' }}>
                          <div>{formatDate(a.scheduled_at)}</div>
                          <div>{formatTime(a.scheduled_at)}</div>
                        </div>
                        <div style={s.avatar(a.clients?.first_name||'')}>
                          {initials(a.clients?.first_name||'', a.clients?.last_name||'')}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{a.clients?.first_name} {a.clients?.last_name}</div>
                          <div style={{ fontSize:12, color:'#9090a8' }}>{a.services?.icon} {a.services?.name}</div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#22c55e' }}>₪{a.services?.price}</div>
                        <button onClick={() => deleteAppointment(a.id)}
                          style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:6, color:'#ef4444', padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
                          מחק
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {page==='clients' && (
            <div style={s.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['לקוח','טלפון','סטטוס','פעולות'].map(h => (
                        <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#5a5a6e', borderBottom:'1px solid #2e2e38', textTransform:'uppercase', background:'#1e1e24' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(c => (
                      <tr key={c.id} style={{ borderBottom:'1px solid #2e2e38' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={s.avatar(c.first_name)}>{initials(c.first_name, c.last_name)}</div>
                            <div>
                              <div style={{ fontWeight:600 }}>{c.first_name} {c.last_name}</div>
                              <div style={{ fontSize:11, color:'#5a5a6e' }}>{c.email||''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', color:'#9090a8' }}>{c.phone}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={s.badge(c.status)}>{c.status==='vip'?'VIP':c.status==='new'?'חדש':'פעיל'}</span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <button onClick={() => { setApptClient(c.id); setModal('appt') }}
                            style={{ ...s.btn('sm'), background:'rgba(124,106,255,0.12)', color:'#a78bfa', border:'none' }}>
                            📅 תור
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERVICES */}
          {page==='services' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {services.map(sv => (
                <div key={sv.id} style={{ ...s.card, marginBottom:0, padding:18 }}>
                  <div style={{ fontSize:26, marginBottom:10 }}>{sv.icon}</div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{sv.name}</div>
                  <div style={{ fontSize:12, color:'#9090a8' }}>⏱ {sv.duration} דקות</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#a78bfa', marginTop:10 }}>₪{sv.price}</div>
                </div>
              ))}
              {services.length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#5a5a6e' }}>
                  אין שירותים עדיין — לחץ "+ שירות" להוסיף
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          {page==='stats' && (
            <>
              <div style={s.statsGrid}>
                {[
                  { label:'סה"כ לקוחות', value:clients.length, color:'#a78bfa' },
                  { label:'סה"כ תורים', value:appointments.length, color:'#22c55e' },
                  { label:'שירותים פעילים', value:services.length, color:'#f59e0b' },
                  { label:'הכנסה משוערת (חודש)', value:`₪${appointments.filter(a=>a.scheduled_at?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,a)=>s+(a.services?.price||0),0)}`, color:'#06b6d4' },
                ].map((stat,i) => (
                  <div key={i} style={s.statCard(stat.color)}>
                    <div style={{ fontSize:12, color:'#9090a8', marginBottom:8 }}>{stat.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <div style={s.cardHeader}><div style={s.cardTitle}>👑 לקוחות אחרונים</div></div>
                <div style={s.cardBody}>
                  {clients.slice(0,5).map(c => (
                    <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #2e2e38' }}>
                      <div style={s.avatar(c.first_name)}>{initials(c.first_name, c.last_name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600 }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize:12, color:'#9090a8' }}>{c.phone}</div>
                      </div>
                      <span style={s.badge(c.status)}>{c.status==='vip'?'VIP':c.status==='new'?'חדש':'פעיל'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* MODAL - NEW APPOINTMENT */}
      <Modal id="appt" title="📅 תור חדש" onSave={saveAppointment}>
        <div style={s.formGroup}>
          <label style={s.label}>לקוח</label>
          <select value={apptClient} onChange={e => setApptClient(e.target.value)} style={s.input}>
            <option value="">— בחר לקוח —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>שירות</label>
          <select value={apptService} onChange={e => setApptService(e.target.value)} style={s.input}>
            <option value="">— בחר שירות —</option>
            {services.map(sv => <option key={sv.id} value={sv.id}>{sv.icon} {sv.name} — ₪{sv.price}</option>)}
          </select>
        </div>
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>תאריך</label>
            <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} style={s.input} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>שעה</label>
            <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} style={s.input} />
          </div>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>הערות</label>
          <input value={apptNotes} onChange={e => setApptNotes(e.target.value)} placeholder="הערות..." style={s.input} />
        </div>
      </Modal>

      {/* MODAL - NEW CLIENT */}
      <Modal id="client" title="👤 לקוח חדש" onSave={saveClient}>
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>שם פרטי</label>
            <input value={cFname} onChange={e => setCFname(e.target.value)} placeholder="ישראל" style={s.input} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>שם משפחה</label>
            <input value={cLname} onChange={e => setCLname(e.target.value)} placeholder="כהן" style={s.input} />
          </div>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>טלפון</label>
          <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="050-0000000" style={s.input} />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>אימייל</label>
          <input value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="example@gmail.com" style={s.input} />
        </div>
      </Modal>

      {/* MODAL - NEW SERVICE */}
      <Modal id="service" title="✂️ שירות חדש" onSave={saveService}>
        <div style={s.formGroup}>
          <label style={s.label}>שם השירות</label>
          <input value={sName} onChange={e => setSName(e.target.value)} placeholder="תספורת גברים" style={s.input} />
        </div>
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>מחיר (₪)</label>
            <input type="number" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="80" style={s.input} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>משך (דקות)</label>
            <input type="number" value={sDuration} onChange={e => setSDuration(e.target.value)} placeholder="30" style={s.input} />
          </div>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>אייקון</label>
          <input value={sIcon} onChange={e => setSIcon(e.target.value)} placeholder="✂️" style={s.input} maxLength={2} />
        </div>
      </Modal>

      {/* TOAST */}
      {toast && <div style={s.toastBox}>{toast}</div>}
    </div>
  )
}
