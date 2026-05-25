export const CLIENTS = [
  {
    slug: 'bom-pain',
    name: 'Bom Pain',
    industry: 'Restaurante · Café',
    emoji: '☕',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,.14)',
    website: 'https://www.bompain.indexte.com',
    phone: '+595 981 123 456',
    email: 'hola@bompain.com',
    address: 'Av. Mcal. López 1234, Asunción',
    instagram: '@bom_pain_py',
    plan: 'Pro',
    active: true,
    since: '2024-08',
  },
  {
    slug: 'la-pelu',
    name: 'La Pelu Barbershop',
    industry: 'Barbershop',
    emoji: '✂️',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,.14)',
    website: 'https://demo-la-pelu.vercel.app',
    phone: '+595 985 349 594',
    email: 'lapelu@gmail.com',
    address: 'Independencia Nacional 456, Asunción',
    instagram: '@la_pelu_barbershop_2022',
    plan: 'Standard',
    active: true,
    since: '2024-10',
  },
  {
    slug: 'divina-skybar',
    name: 'Divina Sky Bar',
    industry: 'Bar · Rooftop',
    emoji: '🌆',
    color: '#6366f1',
    colorBg: 'rgba(99,102,241,.14)',
    website: 'https://demo-divina-skybar.vercel.app',
    phone: '+595 982 777 888',
    email: 'info@divinaskybar.com',
    address: 'Av. Santa Teresa 890, Asunción',
    instagram: '@divina_skybar',
    plan: 'Pro',
    active: true,
    since: '2024-09',
  },
  {
    slug: 'quattro-d',
    name: 'Quattro D Heladería',
    industry: 'Heladería',
    emoji: '🍦',
    color: '#10b981',
    colorBg: 'rgba(16,185,129,.14)',
    website: 'https://demo-quattro-d.vercel.app',
    phone: '+595 981 555 999',
    email: 'quattrod@gmail.com',
    address: 'Mcal. Estigarribia 321, Asunción',
    instagram: '@quattro_d_py',
    plan: 'Standard',
    active: false,
    since: '2025-01',
  },
];

export type Reservation = {
  id: number;
  client: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes: string;
  tenant: string;
};

export const RESERVATIONS: Reservation[] = [
  { id:1,  client:'María García',      email:'mgarcia@gmail.com',    phone:'0981 111 222', service:'Mesa para 2',        date:'2026-05-22', time:'20:00', status:'confirmed', notes:'',                       tenant:'bom-pain' },
  { id:2,  client:'Carlos Rodríguez',  email:'carlos.r@gmail.com',   phone:'0982 333 444', service:'Desayuno buffet',    date:'2026-05-22', time:'08:30', status:'confirmed', notes:'Alergias: lactosa',      tenant:'bom-pain' },
  { id:3,  client:'Ana López',         email:'ana.lopez@gmail.com',  phone:'0983 555 666', service:'Almuerzo ejecutivo', date:'2026-05-23', time:'12:00', status:'pending',   notes:'',                       tenant:'bom-pain' },
  { id:4,  client:'Diego Martínez',    email:'diego.m@outlook.com',  phone:'0984 777 888', service:'Mesa para 4',        date:'2026-05-23', time:'21:00', status:'pending',   notes:'Cumpleaños',             tenant:'bom-pain' },
  { id:5,  client:'Sofía Fernández',   email:'sofi.f@gmail.com',     phone:'0985 999 000', service:'Desayuno buffet',    date:'2026-05-24', time:'09:00', status:'confirmed', notes:'',                       tenant:'bom-pain' },
  { id:6,  client:'Pablo Torres',      email:'pablo.t@gmail.com',    phone:'0986 111 333', service:'Almuerzo ejecutivo', date:'2026-05-25', time:'12:30', status:'confirmed', notes:'',                       tenant:'bom-pain' },
  { id:7,  client:'Valentina Ríos',    email:'vrios@gmail.com',      phone:'0987 222 444', service:'Mesa para 2',        date:'2026-05-26', time:'20:30', status:'pending',   notes:'Aniversario',            tenant:'bom-pain' },
  { id:8,  client:'Sebastián Núñez',   email:'snunez@gmail.com',     phone:'0988 333 555', service:'Cena especial',      date:'2026-05-27', time:'21:00', status:'confirmed', notes:'',                       tenant:'bom-pain' },
  { id:9,  client:'Lucía Herrera',     email:'lucia.h@gmail.com',    phone:'0981 444 666', service:'Desayuno buffet',    date:'2026-05-20', time:'08:00', status:'cancelled', notes:'',                       tenant:'bom-pain' },
  { id:10, client:'Rodrigo Medina',    email:'rmedina@gmail.com',    phone:'0982 555 777', service:'Corte clásico',      date:'2026-05-22', time:'10:00', status:'confirmed', notes:'',                       tenant:'la-pelu' },
  { id:11, client:'Camila Ríos',       email:'crios@gmail.com',      phone:'0983 666 888', service:'Barba',              date:'2026-05-22', time:'11:00', status:'confirmed', notes:'',                       tenant:'la-pelu' },
  { id:12, client:'Agustín López',     email:'agus.l@gmail.com',     phone:'0984 777 999', service:'Combo corte+barba',  date:'2026-05-23', time:'09:30', status:'pending',   notes:'',                       tenant:'la-pelu' },
  { id:13, client:'Tomás Gutiérrez',   email:'tgut@gmail.com',       phone:'0985 888 000', service:'Corte clásico',      date:'2026-05-23', time:'10:30', status:'confirmed', notes:'',                       tenant:'la-pelu' },
  { id:14, client:'Facundo Ibáñez',    email:'facundo.i@gmail.com',  phone:'0986 999 111', service:'Barba',              date:'2026-05-24', time:'09:00', status:'pending',   notes:'',                       tenant:'la-pelu' },
  { id:15, client:'Matías Fernández',  email:'mfernandez@gmail.com', phone:'0987 000 222', service:'Mesa terraza VIP',   date:'2026-05-22', time:'21:30', status:'confirmed', notes:'Reserva VIP',            tenant:'divina-skybar' },
  { id:16, client:'Florencia Sosa',    email:'flor.s@gmail.com',     phone:'0988 111 333', service:'Mesa terraza',       date:'2026-05-23', time:'21:00', status:'pending',   notes:'',                       tenant:'divina-skybar' },
  { id:17, client:'Nicolás Castro',    email:'ncastro@gmail.com',    phone:'0989 222 444', service:'Reserva VIP',        date:'2026-05-24', time:'22:00', status:'confirmed', notes:'Evento privado 20p',     tenant:'divina-skybar' },
  { id:18, client:'Juliana Acosta',    email:'juliana.a@gmail.com',  phone:'0981 333 555', service:'Mesa interior',      date:'2026-05-25', time:'20:30', status:'confirmed', notes:'',                       tenant:'divina-skybar' },
];

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  price: string;
  description: string;
  emoji: string;
  active: boolean;
  featured: boolean;
};

export const MENU_ITEMS: Record<string, MenuItem[]> = {
  'bom-pain': [
    { id:1, name:'Croissant de jamón y queso', category:'Panadería',  price:'Gs 18.000', description:'Croissant artesanal con jamón cocido y queso gruyère',          emoji:'🥐', active:true,  featured:true  },
    { id:2, name:'Café Latte',                 category:'Café',       price:'Gs 12.000', description:'Espresso doble con leche vaporizada cremosa',                   emoji:'☕', active:true,  featured:true  },
    { id:3, name:'Desayuno completo',          category:'Desayuno',   price:'Gs 35.000', description:'Tostadas, huevos revueltos, jugo fresco y café',                emoji:'🍳', active:true,  featured:true  },
    { id:4, name:'Sopa paraguaya',             category:'Típicas',    price:'Gs 20.000', description:'Torta de maíz con queso y cebolla, receta tradicional',        emoji:'🫓', active:true,  featured:false },
    { id:5, name:'Chipá',                      category:'Panadería',  price:'Gs 5.000',  description:'Chipá de almidón con queso, recién horneado',                   emoji:'🧀', active:true,  featured:false },
    { id:6, name:'Almuerzo ejecutivo',         category:'Almuerzo',   price:'Gs 55.000', description:'Sopa, plato principal, postre y bebida incluida',               emoji:'🍽️', active:true,  featured:false },
    { id:7, name:'Pastel mandu',               category:'Típicas',    price:'Gs 15.000', description:'Empanada de maíz rellena con carne o pollo',                   emoji:'🥟', active:true,  featured:false },
    { id:8, name:'Torta de naranja',           category:'Dulces',     price:'Gs 22.000', description:'Torta casera húmeda de naranja con glaseado',                  emoji:'🍊', active:true,  featured:true  },
    { id:9, name:'Capuchino',                  category:'Café',       price:'Gs 14.000', description:'Espresso con espuma de leche y toque de canela',               emoji:'☕', active:false, featured:false },
    { id:10,name:'Medialunas',                 category:'Panadería',  price:'Gs 8.000',  description:'3 medialunas de manteca, doradas y suaves',                    emoji:'🥐', active:true,  featured:false },
  ],
  'la-pelu': [
    { id:1, name:'Corte clásico',      category:'Cortes',   price:'Gs 40.000', description:'Corte personalizado con tijera o máquina', emoji:'✂️', active:true, featured:true  },
    { id:2, name:'Barba',              category:'Barba',    price:'Gs 30.000', description:'Arreglo y perfilado de barba con navaja',   emoji:'🪒', active:true, featured:true  },
    { id:3, name:'Combo corte+barba',  category:'Combos',   price:'Gs 60.000', description:'Corte clásico + arreglo de barba completo', emoji:'💈', active:true, featured:true  },
    { id:4, name:'Corte niños',        category:'Cortes',   price:'Gs 25.000', description:'Corte para menores de 12 años',            emoji:'👦', active:true, featured:false },
  ],
  'divina-skybar': [
    { id:1, name:'Mesa terraza',      category:'Mesas',    price:'Gs 0',       description:'Reserva de mesa en terraza rooftop',       emoji:'🌆', active:true, featured:true  },
    { id:2, name:'Mesa interior',     category:'Mesas',    price:'Gs 0',       description:'Reserva de mesa en salón climatizado',     emoji:'🍸', active:true, featured:false },
    { id:3, name:'Mesa terraza VIP',  category:'VIP',      price:'Gs 150.000', description:'Mesa VIP con vista panorámica, 2 botellas', emoji:'⭐', active:true, featured:true  },
    { id:4, name:'Reserva VIP',       category:'VIP',      price:'Gs 300.000', description:'Sector privado hasta 20 personas',         emoji:'🥂', active:true, featured:true  },
  ],
};

export type CRMContact = {
  id: number;
  name: string;
  email: string;
  phone: string;
  visits: number;
  lastVisit: string;
  totalSpent: string;
  notes: string;
};

export const CRM_CONTACTS: Record<string, CRMContact[]> = {
  'bom-pain': [
    { id:1,  name:'María García',     email:'mgarcia@gmail.com',   phone:'0981 111 222', visits:12, lastVisit:'2026-05-22', totalSpent:'Gs 420.000', notes:'Cliente VIP, prefiere mesa 5' },
    { id:2,  name:'Carlos Rodríguez', email:'carlos.r@gmail.com',  phone:'0982 333 444', visits:8,  lastVisit:'2026-05-20', totalSpent:'Gs 280.000', notes:'Alergia a lácteos' },
    { id:3,  name:'Ana López',        email:'ana.lopez@gmail.com', phone:'0983 555 666', visits:5,  lastVisit:'2026-05-18', totalSpent:'Gs 175.000', notes:'' },
    { id:4,  name:'Diego Martínez',   email:'diego.m@outlook.com', phone:'0984 777 888', visits:3,  lastVisit:'2026-05-15', totalSpent:'Gs 105.000', notes:'Viene los fines de semana' },
    { id:5,  name:'Sofía Fernández',  email:'sofi.f@gmail.com',    phone:'0985 999 000', visits:7,  lastVisit:'2026-05-22', totalSpent:'Gs 245.000', notes:'' },
    { id:6,  name:'Pablo Torres',     email:'pablo.t@gmail.com',   phone:'0986 111 333', visits:2,  lastVisit:'2026-05-10', totalSpent:'Gs 70.000',  notes:'Nuevo cliente' },
    { id:7,  name:'Valentina Ríos',   email:'vrios@gmail.com',     phone:'0987 222 444', visits:4,  lastVisit:'2026-05-08', totalSpent:'Gs 140.000', notes:'Aniversario en mayo' },
    { id:8,  name:'Sebastián Núñez',  email:'snunez@gmail.com',    phone:'0988 333 555', visits:9,  lastVisit:'2026-05-21', totalSpent:'Gs 315.000', notes:'Grupo empresarial' },
  ],
  'la-pelu': [
    { id:1,  name:'Rodrigo Medina',   email:'rmedina@gmail.com',   phone:'0982 555 777', visits:18, lastVisit:'2026-05-22', totalSpent:'Gs 720.000', notes:'Cliente fijo cada 2 semanas' },
    { id:2,  name:'Camila Ríos',      email:'crios@gmail.com',     phone:'0983 666 888', visits:6,  lastVisit:'2026-05-22', totalSpent:'Gs 180.000', notes:'' },
    { id:3,  name:'Agustín López',    email:'agus.l@gmail.com',    phone:'0984 777 999', visits:10, lastVisit:'2026-05-19', totalSpent:'Gs 400.000', notes:'' },
    { id:4,  name:'Tomás Gutiérrez',  email:'tgut@gmail.com',      phone:'0985 888 000', visits:4,  lastVisit:'2026-05-18', totalSpent:'Gs 160.000', notes:'' },
    { id:5,  name:'Facundo Ibáñez',   email:'facundo.i@gmail.com', phone:'0986 999 111', visits:7,  lastVisit:'2026-05-17', totalSpent:'Gs 280.000', notes:'Prefiere barba larga' },
  ],
  'divina-skybar': [
    { id:1,  name:'Matías Fernández', email:'mfernandez@gmail.com',phone:'0987 000 222', visits:22, lastVisit:'2026-05-22', totalSpent:'Gs 3.300.000', notes:'VIP, organiza eventos corporativos' },
    { id:2,  name:'Florencia Sosa',   email:'flor.s@gmail.com',    phone:'0988 111 333', visits:8,  lastVisit:'2026-05-21', totalSpent:'Gs 960.000',   notes:'' },
    { id:3,  name:'Nicolás Castro',   email:'ncastro@gmail.com',   phone:'0989 222 444', visits:5,  lastVisit:'2026-05-20', totalSpent:'Gs 1.500.000', notes:'Reservas grandes grupos' },
    { id:4,  name:'Juliana Acosta',   email:'juliana.a@gmail.com', phone:'0981 333 555', visits:12, lastVisit:'2026-05-19', totalSpent:'Gs 1.440.000', notes:'' },
  ],
  'quattro-d': [],
};

export const PROMO_DATA = [
  { id:1, name:'Desayuno de Verano',    discount:'15% OFF',   start:'2026-05-01', end:'2026-05-31', active:true,  description:'15% de descuento en todo el menú de desayunos' },
  { id:2, name:'Mesa Romántica',        discount:'Pkg Esp.',  start:'2026-05-14', end:'2026-05-28', active:true,  description:'Mesa decorada + vino + postre sin cargo' },
  { id:3, name:'Almuerzo Ejecutivo 2x1',discount:'2×1',      start:'2026-04-01', end:'2026-04-30', active:false, description:'Segundo almuerzo ejecutivo sin cargo (Lun-Vie)' },
];

export const HOURS_DATA = [
  { day:'Lunes — Viernes', open:'07:00', close:'22:00', closed:false },
  { day:'Sábados',         open:'08:00', close:'23:00', closed:false },
  { day:'Domingos',        open:'09:00', close:'21:00', closed:false },
];

export const SEO_DATA: Record<string, {
  visits: number[]; labels: string[];
  sources: { name: string; pct: number; color: string }[];
  pages: { page: string; views: number; bounce: string }[];
}> = {
  'bom-pain': {
    visits: [420, 380, 510, 490, 620, 580, 710, 650, 740, 690, 810, 760],
    labels: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    sources: [
      { name:'Google',      pct:48, color:'#6366f1' },
      { name:'Instagram',   pct:28, color:'#8b5cf6' },
      { name:'Directo',     pct:14, color:'#10b981' },
      { name:'WhatsApp',    pct:10, color:'#f59e0b' },
    ],
    pages: [
      { page:'/menu',         views:2840, bounce:'34%' },
      { page:'/',             views:1920, bounce:'28%' },
      { page:'/reservar',     views:1340, bounce:'18%' },
      { page:'/galeria',      views:890,  bounce:'42%' },
      { page:'/contacto',     views:620,  bounce:'55%' },
    ],
  },
  'la-pelu': {
    visits: [180, 210, 195, 230, 260, 245, 290, 275, 310, 295, 340, 360],
    labels: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    sources: [
      { name:'Google',      pct:42, color:'#6366f1' },
      { name:'Instagram',   pct:38, color:'#8b5cf6' },
      { name:'Directo',     pct:12, color:'#10b981' },
      { name:'WhatsApp',    pct:8,  color:'#f59e0b' },
    ],
    pages: [
      { page:'/',           views:1240, bounce:'31%' },
      { page:'/servicios',  views:980,  bounce:'26%' },
      { page:'/reservar',   views:760,  bounce:'15%' },
      { page:'/galeria',    views:420,  bounce:'48%' },
    ],
  },
  'divina-skybar': {
    visits: [650, 720, 690, 810, 880, 840, 960, 910, 1020, 980, 1100, 1050],
    labels: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    sources: [
      { name:'Instagram',   pct:52, color:'#8b5cf6' },
      { name:'Google',      pct:28, color:'#6366f1' },
      { name:'Directo',     pct:12, color:'#10b981' },
      { name:'TikTok',      pct:8,  color:'#ef4444'  },
    ],
    pages: [
      { page:'/',           views:4200, bounce:'22%' },
      { page:'/reservar',   views:2980, bounce:'12%' },
      { page:'/menu',       views:2140, bounce:'38%' },
      { page:'/galeria',    views:1560, bounce:'44%' },
      { page:'/eventos',    views:980,  bounce:'30%' },
    ],
  },
  'quattro-d': {
    visits: [220, 210, 240, 260, 280, 270, 300, 290, 320, 310, 340, 330],
    labels: ['Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'],
    sources: [
      { name:'Instagram', pct:55, color:'#8b5cf6' },
      { name:'Google',    pct:30, color:'#6366f1' },
      { name:'Directo',   pct:15, color:'#10b981' },
    ],
    pages: [
      { page:'/',       views:1100, bounce:'35%' },
      { page:'/menu',   views:870,  bounce:'28%' },
    ],
  },
};
