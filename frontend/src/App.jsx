import { useState } from "react"
import { Routes, Route } from "react-router-dom"
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import FloatingShape from "./components/FloatingShape"
import { Toaster } from "react-hot-toast"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import Home from "./pages/HomePage"
import CategoryPage from "./pages/CategoryPage"
import CartPage from "./pages/CartPage"
import PurchaseCancelPage from "./pages/PurchaseCancelPage"
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage"
import Navbar from "./components/Navbar";
import AdminPage from "./pages/AdminPage"

export default function App() {

  const [cartItem, setCartItem] = useState([]);

  return (

    <div
      className='min-h-screen bg-gradient-to-br
    from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden'
    >
      <FloatingShape color='bg-green-500' size='w-64 h-64' top='-5%' left='10%' delay={0} />
      <FloatingShape color='bg-emerald-500' size='w-48 h-48' top='70%' left='80%' delay={5} />
      <FloatingShape color='bg-lime-500' size='w-32 h-32' top='40%' left='-10%' delay={2} />

      <Navbar cartItem={cartItem} />
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/mail-verification" element={<EmailVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<CategoryPage cartItem={cartItem} setCartItem={setCartItem} />} />

          <Route path="/cart" element={<CartPage cartItem={cartItem} setCartItem={setCartItem} />} />
          <Route path="/purchase-cancel" element={<PurchaseCancelPage />} />

          <Route path='/purchase-success' element={<PurchaseSuccessPage />} />
        
          <Route path="/secret-dashboard" element={<AdminPage />} />
        </Routes>

      <Toaster />
    </div>
  )
}