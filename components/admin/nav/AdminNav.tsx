import { Logout } from "@payloadcms/ui";
import { NavHamburger, NavWrapper } from "@payloadcms/next/client";

import { MENU } from "./menu";
import { Sidebar } from "./Sidebar";
import "./sidebar.css";

/**
 * Payload'ın varsayılan yan barının yerine geçer.
 *
 * Kabuk (NavWrapper, NavHamburger) Payload'dan alınır; böylece mobil
 * açılır menü, klavye davranışı ve panel düzeni bozulmadan çalışmaya
 * devam eder. Değişen yalnızca içeriktir.
 */
export const AdminNav: React.FC = () => {
  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap">
        <Sidebar groups={MENU} />
        <div className="nav__controls">
          <Logout />
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
};

export default AdminNav;
