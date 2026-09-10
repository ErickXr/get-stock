import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import RegisterSeller from "./pages/RegisterSeller.jsx";
import ActivateSeller from "./pages/ActivateSeller.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";

import ProductList from "./pages/Products/List.jsx";
import CreateProduct from "./pages/Products/Create.jsx";
import EditProduct from "./pages/Products/Edit.jsx";

import SalesList from "./pages/Sales/List.jsx";
import CreateSale from "./pages/Sales/Create.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterSeller />} />
        <Route path="/activate" element={<ActivateSeller />} />

        {/* Privadas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Profile />} />

          <Route path="/produtos" element={<ProductList />} />
          <Route path="/produtos/novo" element={<CreateProduct />} />
          <Route path="/produtos/:id" element={<EditProduct />} />

          <Route path="/vendas" element={<SalesList />} />
          <Route path="/vendas/nova" element={<CreateSale />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;