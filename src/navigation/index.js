import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  redirect,
  NavLink,
} from 'react-router-dom';
import {
  AuthLayout,
  DashboardLayout,
  ProtectedRoute,
  RootLayout,
} from '../components';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Home from '../pages/dashboard/Home';
import Users from '../pages/dashboard/users/Users';
import DeletedUsers from '../pages/dashboard/users/DeletedUsers';
import UnverifiedUsers from '../pages/dashboard/users/UnverifiedUsers';
import EditUser from '../pages/dashboard/users/EditUser';
import Settings from '../pages/dashboard/Settings';
import React from 'react';
import {Text} from '@chakra-ui/react';
import Cookies from 'js-cookie';
import {setAuthToken} from '../api';
import CreateUser from '../pages/dashboard/users/CreateUser';
import Markets from '../pages/dashboard/markets/Markets';
import EditMarket from '../pages/dashboard/markets/EditMarket';
import EditVipChannel from '../pages/dashboard/channels/EditVipChannel';
import VipChannels from '../pages/dashboard/channels/VipChannels';
import Products from '../pages/dashboard/products/Products';
import EditProduct from '../pages/dashboard/products/EditProduct';
import EditPolicy from '../pages/dashboard/policies/EditPolicy';
import Policies from '../pages/dashboard/policies/Policies';
import EditSuggestion from '../pages/dashboard/suggestions/EditSuggestion';
import Suggestions from '../pages/dashboard/suggestions/Suggestions';
import AppRatings from '../pages/dashboard/app-ratings/AppRatings';
import SendPushNotification from '../pages/dashboard/push-notification/SendPushNotification';
import Announcements from '../pages/dashboard/announcements/Announcements';
import CreateAnnouncement from '../pages/dashboard/announcements/CreateAnnouncement';
import Reports from '../pages/dashboard/reports/Reports';
import ReportDetail from '../pages/dashboard/reports/ReportDetail';
import EditChannel from '../pages/dashboard/channels/EditChannel';
import AllChannels from '../pages/dashboard/channels/AllChannels';
import Ads from '../pages/dashboard/ads/Ads';
import EditAds from '../pages/dashboard/ads/EditAds';
import AddVipApplication from '../pages/dashboard/vipapplications/AddVipApplication';
import VipApplications from '../pages/dashboard/vipapplications/VipApplications';
import BulkMessage from '../pages/dashboard/messaging/BulkMessage';
import Channels from '../pages/dashboard/messaging/Channels';
import ChannelChat from '../pages/dashboard/messaging/ChannelChat';
import AppDistribution from '../pages/dashboard/distribution/AppDistribution';
import Moderation from '../pages/dashboard/moderation/Moderation';
import ArchivedMessages from '../pages/dashboard/messaging/ArchivedMessages';
import Conferences from '../pages/dashboard/conferences/Conferences';
import DbStats from '../pages/dashboard/database/DbStats';
import AiService from '../pages/dashboard/ai-service/AiService';
import ProfanityWords from '../pages/dashboard/profanity-words/ProfanityWords';
import PriceAlerts from '../pages/dashboard/price-alerts/PriceAlerts';
import EconomicCalendar from '../pages/dashboard/economic-calendar/EconomicCalendar';
import NewsModeration from '../pages/dashboard/news-moderation/NewsModeration';
import LiveBroadcasts from '../pages/dashboard/live-broadcasts/LiveBroadcasts';
import PurchaseManagement from '../pages/dashboard/purchase-management/PurchaseManagement';
import ChannelReviews from '../pages/dashboard/channel-reviews/ChannelReviews';
import SystemSettings from '../pages/dashboard/system-settings/SystemSettings';
import NotificationTemplates from '../pages/dashboard/notification-templates/NotificationTemplates';
import ScheduledNotifications from '../pages/dashboard/scheduled-notifications/ScheduledNotifications';
import Subscriptions from '../pages/dashboard/subscriptions/Subscriptions';
import Polls from '../pages/dashboard/polls/Polls';

const rootLoader = async ({request}) => {
  const {pathname} = new URL(request.url);

  setAuthToken(Cookies.get('token'));

  if (pathname === '/') {
    return redirect('/dashboard');
  }

  return true;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} loader={rootLoader}>
      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
        handle={{
          crumb: () => <NavLink to="/dashboard">Anasayfa</NavLink>,
        }}>
        <Route
          path="users"
          handle={{
            crumb: () => <NavLink to="/dashboard/users">Kullanıcılar</NavLink>,
          }}>
          <Route
            path="create"
            element={<CreateUser />}
            handle={{
              crumb: () => <Text>Kullanıcı Oluştur</Text>,
            }}
          />
          <Route
            path="deleted"
            element={<DeletedUsers />}
            handle={{
              crumb: () => <Text>Silinen Kullanıcılar</Text>,
            }}
          />
          <Route
            path="unverified"
            element={<UnverifiedUsers />}
            handle={{
              crumb: () => <Text>Doğrulanmamış Üyeler</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditUser />}
            handle={{
              crumb: () => <Text>Kullanıcı Düzenle</Text>,
            }}
          />
          <Route index element={<Users />} />
        </Route>
        <Route
          path="database-stats"
          element={<DbStats />}
          handle={{
            crumb: () => <Text>DB İstatistikleri</Text>,
          }}
        />
        <Route
          path="ai-service"
          element={<AiService />}
          handle={{
            crumb: () => <Text>AI Servisi</Text>,
          }}
        />
        <Route
          path="profanity-words"
          element={<ProfanityWords />}
          handle={{
            crumb: () => <Text>Yasaklı Kelimeler</Text>,
          }}
        />
        <Route
          path="price-alerts"
          element={<PriceAlerts />}
          handle={{
            crumb: () => <Text>Fiyat Alarmları</Text>,
          }}
        />
        <Route
          path="economic-calendar"
          element={<EconomicCalendar />}
          handle={{
            crumb: () => <Text>Ekonomik Takvim</Text>,
          }}
        />
        <Route
          path="news-moderation"
          element={<NewsModeration />}
          handle={{
            crumb: () => <Text>Haber Moderasyonu</Text>,
          }}
        />
        <Route
          path="live-broadcasts"
          element={<LiveBroadcasts />}
          handle={{
            crumb: () => <Text>Canlı Yayınlar</Text>,
          }}
        />
        <Route
          path="purchase-management"
          element={<PurchaseManagement />}
          handle={{
            crumb: () => <Text>Satın Alma Yönetimi</Text>,
          }}
        />
        <Route
          path="channel-reviews"
          element={<ChannelReviews />}
          handle={{
            crumb: () => <Text>Kanal Yorumları</Text>,
          }}
        />
        <Route
          path="system-settings"
          element={<SystemSettings />}
          handle={{
            crumb: () => <Text>Sistem Ayarları</Text>,
          }}
        />
        <Route
          path="notification-templates"
          element={<NotificationTemplates />}
          handle={{
            crumb: () => <Text>Bildirim Şablonları</Text>,
          }}
        />
        <Route
          path="scheduled-notifications"
          element={<ScheduledNotifications />}
          handle={{
            crumb: () => <Text>Zamanlanmış Bildirimler</Text>,
          }}
        />
        <Route
          path="polls"
          element={<Polls />}
          handle={{
            crumb: () => <Text>Anketler</Text>,
          }}
        />
        <Route
          path="markets"
          handle={{
            crumb: () => <NavLink to="/dashboard/markets">Piyasalar</NavLink>,
          }}>
          <Route
            path="new"
            element={<EditMarket />}
            handle={{
              crumb: () => <Text>Hisse/Kripto Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditMarket />}
            handle={{
              crumb: () => <Text>Hisse/Kripto Düzenle</Text>,
            }}
          />
          <Route index element={<Markets />} />
        </Route>
        <Route
          path="channels"
          handle={{
            crumb: () => <Text>Kanallar</Text>,
          }}>
          <Route
            path="all"
            element={<AllChannels types="market,fund,normal" />}
            handle={{
              crumb: () => <Text>Tüm Kanallar</Text>,
            }}
          />
          <Route
            path="normal"
            element={
              <AllChannels
                types="market,fund,normal"
                onlyAdminCanPost={false}
              />
            }
            handle={{
              crumb: () => <Text>Normal Kanallar</Text>,
            }}
          />
          <Route
            path="restricted"
            element={
              <AllChannels
                types="market,fund,normal"
                onlyAdminCanPost={true}
              />
            }
            handle={{
              crumb: () => <Text>Kısıtlı Kanallar</Text>,
            }}
          />
          <Route
            path="vip"
            handle={{
              crumb: () => <NavLink to="/dashboard/channels/vip">Vip</NavLink>,
            }}>
            <Route
              path="new"
              element={<EditVipChannel />}
              handle={{
                crumb: () => <Text>Kanal Ekle</Text>,
              }}
            />
            <Route
              path=":id"
              element={<EditVipChannel />}
              handle={{
                crumb: () => <Text>Kanal Düzenle</Text>,
              }}
            />

            <Route index element={<VipChannels />} />
          </Route>
          <Route
            path="stock"
            element={<AllChannels category="borsa" />}
            handle={{
              crumb: () => <Text>Borsa Kanalları</Text>,
            }}
          />
          <Route
            path="crypto"
            element={<AllChannels category="kripto" />}
            handle={{
              crumb: () => <Text>Kripto Kanalları</Text>,
            }}
          />
          <Route
            path="viop"
            element={<AllChannels category="viop" />}
            handle={{
              crumb: () => <Text>VİOP Kanalları</Text>,
            }}
          />
          <Route
            path="commodity"
            element={<AllChannels category="emtia" />}
            handle={{
              crumb: () => <Text>Emtia Kanalları</Text>,
            }}
          />
          <Route
            path="fund"
            element={<AllChannels category="fon" />}
            handle={{
              crumb: () => <Text>Fon Kanalları</Text>,
            }}
          />

          <Route
            path=":id"
            element={<EditChannel />}
            handle={{
              crumb: () => <Text>Kanal Düzenle</Text>,
            }}
          />
        </Route>
        <Route
          path="products"
          handle={{
            crumb: () => (
              <NavLink to="/dashboard/products">Abonelikler</NavLink>
            ),
          }}>
          <Route
            path="new"
            element={<EditProduct />}
            handle={{
              crumb: () => <Text>Abonelik Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditProduct />}
            handle={{
              crumb: () => <Text>Abonelik Düzenle</Text>,
            }}
          />
          <Route index element={<Products />} />
        </Route>
        <Route
          path="ads"
          handle={{
            crumb: () => <NavLink to="/dashboard/ads">Reklamlar</NavLink>,
          }}>
          <Route
            path="new"
            element={<EditAds />}
            handle={{
              crumb: () => <Text>Reklam Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditAds />}
            handle={{
              crumb: () => <Text>Reklam Düzenle</Text>,
            }}
          />
          <Route index element={<Ads />} />
        </Route>
        <Route
          path="policies"
          handle={{
            crumb: () => (
              <NavLink to="/dashboard/policies">Sözleşmeler</NavLink>
            ),
          }}>
          <Route
            path="new"
            element={<EditPolicy />}
            handle={{
              crumb: () => <Text>Sözleşme Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditPolicy />}
            handle={{
              crumb: () => <Text>Sözleşme Düzenle</Text>,
            }}
          />
          <Route index element={<Policies />} />
        </Route>
        <Route
          path="suggestions"
          handle={{
            crumb: () => (
              <NavLink to="/dashboard/suggestions">Haftalık Öneriler</NavLink>
            ),
          }}>
          <Route
            path="new"
            element={<EditSuggestion />}
            handle={{
              crumb: () => <Text>Öneri Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditSuggestion />}
            handle={{
              crumb: () => <Text>Öneri Düzenle</Text>,
            }}
          />
          <Route index element={<Suggestions />} />
        </Route>
        <Route
          path="app-ratings"
          element={<AppRatings />}
          handle={{
            crumb: () => <Text>Uygulama Değerlendirmeleri</Text>,
          }}
        />
        <Route
          path="vipapplications"
          handle={{
            crumb: () => (
              <NavLink to="/dashboard/vipapplications">Vip Başvuruları</NavLink>
            ),
          }}>
          <Route
            path=":id"
            element={<AddVipApplication />}
            handle={{
              crumb: () => <Text>Vip Başvuru Düzenle</Text>,
            }}
          />
          <Route
            path="new"
            element={<AddVipApplication />}
            handle={{
              crumb: () => <Text>Vip Başvuru Ekle</Text>,
            }}
          />
          <Route
            path=""
            element={<VipApplications />}
            handle={{
              crumb: () => <Text>Vip Başvurularını Listele</Text>,
            }}
          />
          <Route index element={<VipApplications />} />
        </Route>
        <Route
          path="settings"
          element={<Settings />}
          handle={{
            crumb: () => <Text>Ayarlar</Text>,
          }}
        />
        <Route
          path="send-push-notification"
          element={<SendPushNotification />}
          handle={{
            crumb: () => <Text>Bildirim Gönder</Text>,
          }}
        />
        <Route
          path="announcements"
          element={<Announcements />}
          handle={{
            crumb: () => <Text>Duyurular</Text>,
          }}
        />
        <Route
          path="announcements/new"
          element={<CreateAnnouncement />}
          handle={{
            crumb: () => <Text>Yeni Duyuru</Text>,
          }}
        />
        <Route
          path="announcements/:id"
          element={<CreateAnnouncement />}
          handle={{
            crumb: () => <Text>Duyuru Düzenle</Text>,
          }}
        />
        <Route
          path="messaging/bulk"
          element={<BulkMessage />}
          handle={{
            crumb: () => <Text>Toplu Mesaj</Text>,
          }}
        />
        <Route
          path="messaging/channels"
          element={<Channels />}
          handle={{
            crumb: () => <Text>Kanallar</Text>,
          }}
        />
        <Route
          path="messaging/channels/normal"
          element={
            <Channels
              types="market,fund,normal"
              onlyAdminCanPost={false}
            />
          }
          handle={{
            crumb: () => <Text>Normal Kanallar</Text>,
          }}
        />
        <Route
          path="messaging/channels/restricted"
          element={
            <Channels
              types="market,fund,normal"
              onlyAdminCanPost={true}
            />
          }
          handle={{
            crumb: () => <Text>Kısıtlı Kanallar</Text>,
          }}
        />
        <Route
          path="messaging/channels/:channelId"
          element={<ChannelChat />}
          handle={{
            crumb: () => <Text>Sohbet</Text>,
          }}
        />
        <Route
          path="distribution"
          element={<AppDistribution />}
          handle={{
            crumb: () => <Text>Test Dağıtımı</Text>,
          }}
        />
        <Route
          path="moderation"
          element={<Moderation />}
          handle={{
            crumb: () => <Text>İçerik Moderasyonu</Text>,
          }}
        />
        <Route
          path="messaging/archives"
          element={<ArchivedMessages />}
          handle={{
            crumb: () => <Text>Arşiv</Text>,
          }}
        />
        <Route
          path="subscriptions"
          element={<Subscriptions />}
          handle={{
            crumb: () => <Text>Abonelikler</Text>,
          }}
        />
        <Route
          path="conferences"
          element={<Conferences />}
          handle={{
            crumb: () => <Text>Video Konferanslar</Text>,
          }}
        />
        <Route
          path="reports"
          handle={{
            crumb: () => <NavLink to="/dashboard/reports">Raporlar</NavLink>,
          }}>
          <Route
            path=":id"
            element={<ReportDetail />}
            handle={{
              crumb: () => <Text>Rapor Detay</Text>,
            }}
          />
          <Route index element={<Reports />} />
        </Route>
        <Route index element={<Home />} />
      </Route>
    </Route>,
  ),
);

const Navigation = () => {
  return <RouterProvider router={router} />;
};

export default Navigation;
