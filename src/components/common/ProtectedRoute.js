import {Navigate, Outlet} from 'react-router-dom';
import {useUserStore} from '../../store';
import Cookies from 'js-cookie';

const ProtectedRoute = ({roles, redirect = '/auth/login', children}) => {
  const user = useUserStore(state => state.user);
  const token = Cookies.get('token');

  // Check both user state and token
  if (!user || !token || (roles && !roles.includes(user.role))) {
    return <Navigate to={redirect} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
