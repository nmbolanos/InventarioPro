import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Inventario<span>Pro</span></h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                                Inicio
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/productos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                Administración de Productos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/ajustes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                Ajuste de Productos
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
