# Borsa Admin Paneli - Kapsamlı Proje Dokümantasyonu

## 📋 İçindekiler
1. [Genel Proje Bilgileri](#genel-proje-bilgileri)
2. [Teknoloji Stack'i](#teknoloji-stacki)
3. [Proje Mimarisi](#proje-mimarisi)
4. [Klasör Yapısı](#klasör-yapısı)
5. [Modüller ve Sayfalar](#modüller-ve-sayfalar)
6. [API Yapısı](#api-yapısı)
7. [State Management](#state-management)
8. [Güvenlik ve Kimlik Doğrulama](#güvenlik-ve-kimlik-doğrulama)
9. [Konfigürasyon](#konfigürasyon)
10. [Geliştirici Rehberi](#geliştirici-rehberi)

---

## 🎯 Genel Proje Bilgileri

### Proje Amacı
Bu proje, bir borsa/finans uygulaması için admin panel arayüzüdür. Kullanıcı yönetimi, piyasa verileri, kanal yönetimi, abonelik sistemi ve raporlama gibi özellikleri barındırır.

### Proje Özellikleri
- **Kullanıcı Yönetimi**: Kullanıcı CRUD operasyonları, rol tabanlı yetkilendirme
- **Piyasa Yönetimi**: Hisse senedi ve kripto para yönetimi
- **Kanal Sistemi**: VIP kanallar ve normal kanallar için yönetim
- **Abonelik Sistemi**: Ürün/abonelik planları yönetimi
- **Sözleşme Yönetimi**: Gizlilik, şartlar, rıza metinleri
- **Raporlama**: Kullanıcı şikayetleri ve raporlar
- **Kara Liste**: Spam ve istenmeyen içerik yönetimi
- **Bildirim Sistemi**: Push notification gönderimi

---

## 🛠 Teknoloji Stack'i

### Frontend Teknolojileri
```json
{
  "Framework": "React 18.3.1",
  "UI Library": "Chakra UI 2.8.2",
  "Routing": "React Router DOM 6.23.1",
  "State Management": "Zustand 4.5.2",
  "API Client": "Axios 1.6.8",
  "Data Fetching": "TanStack React Query 5.36.0",
  "Form Yönetimi": "React Hook Form 7.51.4",
  "Validasyon": "Yup 1.4.0",
  "Tablo Yönetimi": "TanStack React Table 8.17.3",
  "Rich Text Editor": "CKEditor5",
  "Icons": "React Icons 5.2.1",
  "Animation": "Framer Motion 11.2.0",
  "Cookie Yönetimi": "js-cookie 3.0.5",
  "Tarih İşlemleri": "date-fns 3.6.0"
}
```

### Development Dependencies
- **Prettier 3.2.5**: Kod formatlaması
- **React Scripts 5.0.1**: Build ve development server

---

## 🏗 Proje Mimarisi

### Mimari Prensipler
1. **Component-Based Architecture**: React'ın component yapısı
2. **Separation of Concerns**: İş mantığı, UI ve veri yönetimi ayrımı
3. **Custom Hooks**: Tekrar kullanılabilir mantık
4. **Atomic Design**: Component hiyerarşisi
5. **API Abstraction**: Merkezileştirilmiş API yönetimi

### State Management Stratejisi
- **Zustand**: Global state yönetimi (kullanıcı bilgileri)
- **React Query**: Server state ve cache yönetimi
- **React Hook Form**: Form state yönetimi
- **Local State**: Component seviyesinde state

---

## 📁 Klasör Yapısı

```
src/
├── api/                      # API katmanı
│   ├── index.js             # API exports
│   ├── client.js            # Axios client konfigürasyonu
│   └── api.js               # API endpoint fonksiyonları
├── components/              # Reusable componentler
│   ├── common/              # Ortak componentler
│   │   ├── Breadcrumbs.js
│   │   ├── Condition.js
│   │   ├── DataTable.js     # Ana tablo componenti
│   │   ├── Footer.js
│   │   ├── MiniStatistics.js
│   │   ├── Page.js          # Sayfa wrapper
│   │   ├── ProtectedRoute.js
│   │   ├── ReadOnlyInfo.js
│   │   ├── RichTextEditor.js
│   │   └── Sidebar.js
│   ├── layouts/             # Layout componentleri
│   │   ├── AuthLayout.js
│   │   ├── DashboardLayout.js
│   │   └── RootLayout.js
│   ├── forgot-password/     # Şifre sıfırlama componentleri
│   │   ├── CodeStep.js
│   │   ├── ResetStep.js
│   │   └── StartStep.js
│   ├── channels/            # Kanal yönetimi componentleri
│   │   └── UserChannels.js
│   └── index.js             # Component exports
├── config/                  # Konfigürasyon dosyaları
│   ├── index.js             # Sabitler ve enums
│   ├── meta.js              # Uygulama meta verileri
│   ├── routes.js            # Route tanımları
│   └── sidebar.js           # Sidebar menü konfigürasyonu
├── hooks/                   # Custom hooks
│   ├── useDisclosure.js     # Modal/popup state yönetimi
│   ├── useDebouncedValue.js # Debounced input değerleri
│   └── useFileInput.js      # Dosya upload işlemleri
├── navigation/              # Routing yapısı
│   └── index.js             # Router konfigürasyonu
├── pages/                   # Sayfa componentleri
│   ├── auth/                # Kimlik doğrulama sayfaları
│   │   ├── Login.js
│   │   └── ForgotPassword.js
│   └── dashboard/           # Dashboard sayfaları
│       ├── Home.js          # Ana sayfa (istatistikler)
│       ├── Settings.js
│       ├── users/           # Kullanıcı yönetimi
│       │   ├── Users.js
│       │   ├── EditUser.js
│       │   └── CreateUser.js
│       ├── markets/         # Piyasa yönetimi
│       │   ├── Markets.js
│       │   └── EditMarket.js
│       ├── channels/        # Kanal yönetimi
│       │   ├── AllChannels.js
│       │   ├── VipChannels.js
│       │   ├── EditChannel.js
│       │   └── EditVipChannel.js
│       ├── products/        # Abonelik yönetimi
│       │   ├── Products.js
│       │   └── EditProduct.js
│       ├── policies/        # Sözleşme yönetimi
│       │   ├── Policies.js
│       │   └── EditPolicy.js
│       ├── reports/         # Raporlar
│       │   ├── Reports.js
│       │   └── ReportDetail.js
│       ├── blacklist/       # Kara liste
│       │   ├── Blacklist.js
│       │   └── EditBlacklist.js
│       └── push-notification/
│           └── SendPushNotification.js
├── store/                   # State management
│   ├── index.js             # Store exports
│   └── user.js              # User state (Zustand)
├── styles/                  # Stil dosyaları
│   ├── theme.js             # Chakra UI tema
│   └── components/          # Component stilleri
│       ├── button.js
│       └── input.js
├── utils/                   # Utility fonksiyonları
│   ├── date.js              # Tarih işlemleri
│   ├── image.js             # Görsel işlemleri
│   ├── object.js            # Nesne manipülasyonu
│   └── string.js            # String işlemleri
├── App.js                   # Ana uygulama componenti
├── App.css                  # Global stiller
└── index.js                 # Uygulama giriş noktası
```

---

## 📄 Modüller ve Sayfalar

### 1. Kimlik Doğrulama Modülü
**Dosyalar**: `src/pages/auth/`
- **Login.js**: Admin girişi
- **ForgotPassword.js**: Şifre sıfırlama (3 adımlı)

**Özellikler**:
- JWT token tabanlı giriş
- Form validasyonu (Yup)
- Şifre sıfırlama akışı (email → kod → yeni şifre)

### 2. Dashboard Ana Sayfası
**Dosya**: `src/pages/dashboard/Home.js`

**İstatistik Kartları**:
- Aktif kullanıcı sayısı
- Aylık aboneler
- Toplam kullanıcı
- VIP kanal sayısı
- Atılan mesaj sayısı
- Hisse senedi sayısı
- Kripto para sayısı
- Son raporlar

### 3. Kullanıcı Yönetimi Modülü
**Dosyalar**: `src/pages/dashboard/users/`

**Özellikler**:
- Kullanıcı listesi (DataTable ile)
- Kullanıcı detayları ve düzenleme
- Yeni kullanıcı oluşturma
- Rol yönetimi (Admin, Kullanıcı, Kanal Admini)
- Kullanıcının kanallarını görüntüleme

**API Endpoints**:
- `GET /users` - Kullanıcı listesi
- `GET /users/:id` - Kullanıcı detayı
- `POST /users` - Kullanıcı oluştur
- `PATCH /users/:id` - Kullanıcı güncelle
- `DELETE /users/:id` - Kullanıcı sil

### 4. Piyasa Yönetimi Modülü
**Dosyalar**: `src/pages/dashboard/markets/`

**Özellikler**:
- Hisse senedi ve kripto para yönetimi
- Piyasa detayları (kod, isim, tip)
- CRUD operasyonları

**Market Tipleri**:
- `stock`: Hisse Senedi
- `crypto`: Kripto Para

### 5. Kanal Yönetimi Modülü
**Dosyalar**: `src/pages/dashboard/channels/`

**Kanal Tipleri**:
- `vip`: VIP Kanallar
- `market`: Piyasa Kanalları
- `private`: Özel Kanallar

**Özellikler**:
- Tüm kanalları listeleme
- VIP kanal yönetimi
- Kanal üyelerini yönetme
- Kullanıcıları kanaldan çıkarma

### 6. Abonelik Sistemi Modülü
**Dosyalar**: `src/pages/dashboard/products/`

**Özellikler**:
- Abonelik planları yönetimi
- Ürün CRUD operasyonları
- Fiyatlandırma yönetimi

### 7. Sözleşme Yönetimi Modülü
**Dosyalar**: `src/pages/dashboard/policies/`

**Sözleşme Tipleri**:
- `privacy`: Gizlilik Politikası
- `terms`: Kullanım Şartları
- `consent`: Kullanıcı Rızası
- `about`: Hakkımızda

**Özellikler**:
- CKEditor ile zengin metin editörü
- HTML içerik yönetimi
- Versiyonlama

### 8. Raporlama Modülü
**Dosyalar**: `src/pages/dashboard/reports/`

**Rapor Tipleri**:
- `user`: Kullanıcı Şikayeti
- `general`: Genel
- `complaint`: Şikayet
- `spam`: Spam Bildirimi
- `channel`: Kanal Şikayeti

### 9. Kara Liste Modülü
**Dosyalar**: `src/pages/dashboard/blacklist/`

**Kara Liste Değer Tipleri**:
- `user-id`: Kullanıcı ID
- `email`: E-posta
- `ip`: IP Adresi
- `text`: Yasaklı Metin

**Kara Liste Kapsamları**:
- `register`: Kayıt Olma
- `channel-message`: Kanala Mesaj Gönderme
- `banned-text`: Yasaklı Mesaj

### 10. Bildirim Sistemi
**Dosya**: `src/pages/dashboard/push-notification/SendPushNotification.js`

**Alıcı Tipleri**:
- `all`: Tüm Kullanıcılar
- `channel`: Kanal Üyeleri

---

## 🌐 API Yapısı

### API Client Konfigürasyonu
**Dosya**: `src/api/client.js`

```javascript
const apiClient = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/v1`,
});

// Authorization header otomatik ekleme
export const setAuthToken = token => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
```

### API Endpoint Kategorileri

#### 1. Kimlik Doğrulama API'leri
```javascript
// Admin girişi
POST /auth/login/admin

// Şifre sıfırlama akışı
POST /auth/forgot-password
POST /auth/verify-reset-password
POST /auth/reset-password
```

#### 2. Kullanıcı API'leri
```javascript
GET /users                    // Kullanıcı listesi
GET /users/:id               // Kullanıcı detayı
POST /users                  // Kullanıcı oluştur
PATCH /users/:id             // Kullanıcı güncelle
DELETE /users/:id            // Kullanıcı sil
PATCH /users/:id/manage      // Kullanıcı yönetimi
GET /users/:id/channels      // Kullanıcının kanalları
```

#### 3. Piyasa API'leri
```javascript
GET /market-details          // Piyasa listesi
GET /market-details/:code    // Piyasa detayı
POST /market-details         // Piyasa oluştur
PATCH /market-details/:code  // Piyasa güncelle
DELETE /market-details/:code // Piyasa sil
```

#### 4. Kanal API'leri
```javascript
GET /channels/vip            // VIP kanallar
GET /channels/all            // Tüm kanallar
GET /channels/:id            // Kanal detayı
POST /channels/vip           // VIP kanal oluştur
PATCH /channels/:id          // Kanal güncelle
DELETE /channels/:id         // Kanal sil
POST /channels/:channelId/kick-out/:userId // Kullanıcıyı çıkar
```

#### 5. Dosya Upload API'leri
```javascript
POST /upload/file            // Dosya yükleme
```

---

## 🗄 State Management

### Zustand Store (Global State)
**Dosya**: `src/store/user.js`

```javascript
export const useUserStore = create()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (user) => set({ user: { ...get().user, ...user } }),
    }),
    { name: "user-store" }
  )
);
```

**Kullanım**:
- Kullanıcı kimlik bilgileri
- Giriş durumu
- Browser'da persist edilir

### React Query (Server State)
**Kullanım Alanları**:
- API çağrıları cache'leme
- Background refetch
- Error handling
- Loading states
- Pagination

**Örnek Kullanım**:
```javascript
const {data, isLoading} = useQuery({
  queryKey: ['users', pagination, debouncedValue],
  queryFn: () => api.getUsers({...params})
});
```

---

## 🔐 Güvenlik ve Kimlik Doğrulama

### JWT Token Yönetimi
1. **Token Storage**: js-cookie ile cookie'de saklanır
2. **Auto Headers**: Axios interceptor ile otomatik header ekleme
3. **Route Protection**: ProtectedRoute componenti ile

### ProtectedRoute Componenti
**Dosya**: `src/components/common/ProtectedRoute.js`

```javascript
const ProtectedRoute = ({roles, redirect = '/auth/login', children}) => {
  const user = useUserStore(state => state.user);

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to={redirect} replace />;
  }

  return children ? children : <Outlet />;
};
```

### Rol Tabanlı Yetkilendirme
**Roller**:
- `admin`: Tam yetki
- `user`: Sınırlı yetki
- `channel-admin`: Kanal yönetimi yetkisi

---

## ⚙️ Konfigürasyon

### Environment Variables
**Dosya**: `.env.example`

```bash
REACT_APP_API_URL=              # API base URL
REACT_APP_STORAGE_URL=          # Dosya depolama URL'i
```

### Chakra UI Tema
**Dosya**: `src/styles/theme.js`

```javascript
const colors = {
  main: '#4644a4',
  primary: {
    50: '#bcbbf4',
    // ... diğer tonlar
    900: '#383769',
  },
};
```

### Prettier Konfigürasyonu
**Dosya**: `.prettierrc`

```json
{
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "none",
  "jsxBracketSameLine": true
}
```

---

## 👨‍💻 Geliştirici Rehberi

### Proje Kurulumu
```bash
# Bağımlılıkları yükle
npm install
# veya
bun install  # Kullanıcı tercihi

# Development server başlat
npm start

# Production build
npm run build

# Test çalıştır
npm test
```

### Kod Yazım Standartları

#### 1. Component Geliştirme
```javascript
// Functional component kullan
const ComponentName = () => {
  // Custom hooks en üstte
  const {data, isLoading} = useQuery({...});
  
  // Event handlers
  const handleClick = () => {
    // işlem
  };

  return (
    // JSX
  );
};

export default ComponentName;
```

#### 2. Custom Hook Geliştirme
```javascript
const useCustomHook = (initialValue) => {
  const [state, setState] = useState(initialValue);
  
  // Hook mantığı
  
  return {
    // Return edilen değerler
  };
};
```

#### 3. API Integration
```javascript
// api/api.js dosyasına ekle
export const newEndpoint = async (params) => {
  return apiClient.get('/new-endpoint', {params});
};

// Sayfada kullanım
const {data} = useQuery({
  queryKey: ['new-endpoint', params],
  queryFn: () => api.newEndpoint(params)
});
```

### DataTable Kullanımı
**En çok kullanılan component**: `src/components/common/DataTable.js`

```javascript
<DataTable
  queryEnabled          // Arama özelliği
  editVisible           // Düzenle butonu
  deleteVisible         // Sil butonu
  onRow={handleRowClick} // Satır tıklama
  columns={[
    {
      header: 'Başlık',
      accessorKey: 'fieldName',
      cell: ({getValue}) => {
        return <CustomCell value={getValue()} />;
      }
    }
  ]}
  fetchData={fetchFunction}
  onDelete={handleDelete}
/>
```

### Form Yönetimi
```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  name: yup.string().required('Gerekli alan'),
});

const Form = () => {
  const {register, handleSubmit, formState: {errors}} = useForm({
    resolver: yupResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <Text color="red">{errors.name.message}</Text>}
    </form>
  );
};
```

### Dosya Upload
```javascript
const FileUploadComponent = () => {
  const fileInput = useFileInput({accept: 'image/*'});

  const handleUpload = async () => {
    const url = await fileInput.upload();
    if (url) {
      // Upload başarılı
    }
  };

  return (
    <>
      {fileInput.input}
      <Button onClick={fileInput.open}>Dosya Seç</Button>
      <Button onClick={handleUpload} isLoading={fileInput.isUploading}>
        Yükle
      </Button>
    </>
  );
};
```

### Yeni Sayfa Ekleme Adımları

1. **Sayfa Componentini Oluştur**
   ```javascript
   // src/pages/dashboard/new-page/NewPage.js
   const NewPage = () => {
     return <Page>İçerik</Page>;
   };
   ```

2. **Route Ekle**
   ```javascript
   // src/config/routes.js
   newPage: {
     path: '/dashboard/new-page',
   }
   ```

3. **Navigation'a Ekle**
   ```javascript
   // src/navigation/index.js
   <Route path="new-page" element={<NewPage />} />
   ```

4. **Sidebar'a Ekle** (isteğe bağlı)
   ```javascript
   // src/config/sidebar.js
   {
     name: 'Yeni Sayfa',
     icon: IconComponent,
     path: routes.newPage.path,
   }
   ```

### Debug ve Troubleshooting

#### 1. API Hataları
- Network sekmesinden API çağrılarını kontrol et
- `apiClient` interceptor'larını gözden geçir
- Environment variables'ları doğrula

#### 2. State Problemleri
- React DevTools kullan
- Zustand store'u kontrol et
- React Query cache'ini gözden geçir

#### 3. Routing Problemleri
- React Router DevTools kullan
- Route tanımlarını kontrol et
- ProtectedRoute mantığını gözden geçir

---

## 🚀 Sonuç

Bu dokümantasyon, Borsa Admin projesinin tüm detaylarını kapsamaktadır. Yeni bir geliştirici bu dokümantasyonu okuyarak:

- Projenin amacını ve kapsamını anlayabilir
- Teknoloji seçimlerinin nedenlerini kavrayabilir
- Kod yapısını ve mimariyi öğrenebilir
- Yeni özellikler geliştirebilir
- Mevcut kodu bakımlayabilir

Proje modern React ekosistemi prensiplerine uygun olarak geliştirilmiş, ölçeklenebilir ve bakımı kolay bir yapıya sahiptir.