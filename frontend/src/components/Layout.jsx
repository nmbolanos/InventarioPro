import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Package, Wrench, BarChart2, TrendingUp, User, LogOut } from 'lucide-react';
import LogoUTN from '../Logo_UTN.png';
import './Layout.css';

const Layout = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const userRoles = user?.roles || [];
    const userPermissions = (user?.permissions || []).map(p => p.toLowerCase().trim());

    // Permisos
    const hasPermisoProductos = userPermissions.includes('inv_productos');
    const hasPermisoKardex = userPermissions.includes('inv_kardex');
    const hasPermisoReportes = userPermissions.includes('inv_reportes');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column' }}>
                    <img src={LogoUTN} alt="UTN Logo" style={{ width: '110px', height: 'auto', objectFit: 'contain', margin: '0 auto 12px auto', alignSelf: 'center', display: 'block' }} />
                    <h2 style={{ width: '100%', textAlign: 'center', margin: 0 }}>Módulo <span>Inventario</span></h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className="sidebar-nav-section">General</li>
                        {hasPermisoReportes && (
                            <li>
                                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                                    <Home size={18} style={{ marginRight: '8px', marginBottom: '2px' }} /> Inicio
                                </NavLink>
                            </li>
                        )}
                        {hasPermisoProductos && (
                            <>
                                <li>
                                    <NavLink to="/productos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                        <Package size={18} style={{ marginRight: '8px', marginBottom: '2px' }} /> Administración de Productos
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/ajustes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                        <Wrench size={18} style={{ marginRight: '8px', marginBottom: '2px' }} /> Ajuste de Productos
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {(hasPermisoKardex || hasPermisoReportes) && (
                            <>
                                <li className="sidebar-nav-section">Reportes</li>
                                {hasPermisoKardex && (
                                    <li>
                                        <NavLink to="/kardex" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                            <BarChart2 size={18} style={{ marginRight: '8px', marginBottom: '2px' }} /> Reporte Kardex
                                        </NavLink>
                                    </li>
                                )}
                                {hasPermisoReportes && (
                                    <li>
                                        <NavLink to="/reporte-stock" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                            <TrendingUp size={18} style={{ marginRight: '8px', marginBottom: '2px' }} /> Reporte de Stock
                                        </NavLink>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="#d10a11" />
                        </div>
                        <div className="user-info">
                            <span className="user-name" title={user?.userName}>{user?.userName || 'Usuario'}</span>
                            <span className="user-role">
                                {userRoles.length > 0 ? userRoles[0] : 'Usuario'}
                            </span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión del sistema" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Cerrar Sesión
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
