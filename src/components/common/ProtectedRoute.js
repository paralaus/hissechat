import {Navigate, Outlet} from 'react-router-dom';
import {useUserStore} from '../../store';

const ProtectedRoute = ({roles, redirect = '/auth/login', children}) => {
  const user = useUserStore(state => state.user);

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to={redirect} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
