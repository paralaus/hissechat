import { Outlet } from "react-router-dom";
import SidebarWithHeader from "../common/Sidebar";

const DashboardLayout = ({}) => {
  return (
    <>
      <SidebarWithHeader>
        <Outlet />
      </SidebarWithHeader>
    </>
  );
};

export default DashboardLayout;
