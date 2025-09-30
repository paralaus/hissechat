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
import SendPushNotification from '../pages/dashboard/push-notification/SendPushNotification';
import Reports from '../pages/dashboard/reports/Reports';
import Blacklist from '../pages/dashboard/blacklist/Blacklist';
import EditBlacklist from '../pages/dashboard/blacklist/EditBlacklist';
import ReportDetail from '../pages/dashboard/reports/ReportDetail';
import EditChannel from '../pages/dashboard/channels/EditChannel';
import AllChannels from '../pages/dashboard/channels/AllChannels';

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
            path=":id"
            element={<EditUser />}
            handle={{
              crumb: () => <Text>Kullanıcı Düzenle</Text>,
            }}
          />
          <Route index element={<Users />} />
        </Route>
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
            element={<AllChannels />}
            handle={{
              crumb: () => <Text>Tüm Kanallar</Text>,
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
        <Route
          path="blacklist"
          handle={{
            crumb: () => (
              <NavLink to="/dashboard/blacklist">Kara Liste</NavLink>
            ),
          }}>
          <Route
            path="new"
            element={<EditBlacklist />}
            handle={{
              crumb: () => <Text>Ekle</Text>,
            }}
          />
          <Route
            path=":id"
            element={<EditBlacklist />}
            handle={{
              crumb: () => <Text>Düzenle</Text>,
            }}
          />
          <Route index element={<Blacklist />} />
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
