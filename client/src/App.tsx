import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary.tsx";
import { validateAPIConfig } from "@/config/apiConfig";
import Index from "./pages/Index.tsx";
import ProductsPage from "./pages/ProductsPage.tsx";
import ProductDetailPage from "./pages/ProductDetailPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import DiscountsPage from "./pages/DiscountsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import AdminLoginPage from "./pages/AdminLoginPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import PaymentResultPage from "./pages/PaymentResultPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    validateAPIConfig();
  }, []);

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <TooltipProvider>
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/discounts" element={<DiscountsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/payment-result" element={<PaymentResultPage />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
