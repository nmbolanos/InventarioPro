import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Verificar si el usuario tiene el rol de Supervisor
    const isSupervisor = (user?.roles || []).some(
        (role) => role.toLowerCase().trim() === 'inv_supervisor'
    );

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Módulo <span>Inventario</span></h2>
                    <span className="sidebar-subtitle">UTN — Sistema de Inventario</span>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className="sidebar-nav-section">General</li>
                        <li>
                            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                                🏠 Inicio
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/productos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                📦 Administración de Productos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/ajustes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                🔧 Ajuste de Productos
                            </NavLink>
                        </li>
                        {isSupervisor && (
                            <>
                                <li className="sidebar-nav-section">Reportes</li>
                                <li>
                                    <NavLink to="/kardex" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                        📊 Reporte Kardex
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/reporte-stock" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                        📈 Reporte de Stock
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">👤</div>
                        <div className="user-info">
                            <span className="user-name" title={user?.userName}>{user?.userName || 'Usuario'}</span>
                            <span className="user-role">
                                {isSupervisor ? 'INV_SUPERVISOR' : 'INV_BODEGUERO'}
                            </span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión del sistema">
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
