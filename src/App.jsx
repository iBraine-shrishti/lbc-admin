import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- ADMIN IMPORTS ---
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./components/admin/AdminLogin";
import Dashboard from "./components/admin/Dashboard";
import AddProduct from "./components/admin/AddProduct";
import AllProducts from "./components/admin/AllProducts";
import Collections from "./components/admin/Collections";
import EditCollection from "./components/admin/EditCollection";
import Inventory from "./components/admin/Inventory";
import TopSellingAdmin from "./components/admin/TopSellingAdmin";
import Orders from "./components/admin/Orders";
import OrderDetails from "./components/admin/OrderDetails";
import CreateOrder from "./components/admin/CreateOrder";
import Customers from "./components/admin/Customers";
import CustomerDetails from "./components/admin/CustomerDetails";
import CustomerSegments from "./components/admin/CustomerSegments";
import Discounts from "./components/admin/Discounts";
import CreateDiscount from "./components/admin/CreateDiscount";
import BlogList from "./components/admin/BlogList";
import EditBlog from "./components/admin/EditBlog";
import BlogCategories from "./components/admin/BlogCategories";
import FAQs from "./components/admin/FAQs";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import ToastContainer from "./components/admin/ToastContainer";

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* --- Root redirect to login portal --- */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* --- ADMIN LOGIN ROUTE (PUBLIC) --- */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* --- PROTECTED ADMIN DASHBOARD ROUTES (PRIVATE) --- */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/react-admin" element={<AdminLayout />}>
            {/* Dashboard Home */}
            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />
            <Route path="dashboard" element={<Dashboard />} />
            {/* Functionality Pages */}
            <Route path="add-product" element={<AddProduct />} />
            {/* Edit Product (Reusing same component) */}
            <Route path="edit-product/:slug" element={<AddProduct />} />
            <Route path="products" element={<AllProducts />} />
            <Route path="products/collections" element={<Collections />} />
            <Route path="products/collections/:id" element={<EditCollection />} />
            <Route path="products/inventory" element={<Inventory />} />
            <Route path="top-selling" element={<TopSellingAdmin />} />
            <Route path="products/top-selling" element={<TopSellingAdmin />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<CreateOrder />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:email" element={<CustomerDetails />} />
            <Route path="customers/segments" element={<CustomerSegments />} />
            <Route path="discount" element={<Discounts />} />
            <Route path="discounts/new" element={<CreateDiscount />} />
            <Route path="discounts/:id" element={<CreateDiscount />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/categories" element={<BlogCategories />} />
            <Route path="blog/new" element={<EditBlog />} />
            <Route path="blog/edit/:id" element={<EditBlog />} />
          </Route>
        </Route>
        
        {/* --- Catch all redirect to root --- */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
