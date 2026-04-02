import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle2, XCircle } from 'lucide-react';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';
  const isInvalid = status === 'invalid_signature' || status === 'failure' || status === 'error';

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-20">
        <div className="max-w-md mx-auto text-center">
            {isSuccess ? (
              <>
                <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Payment Successful</h1>
                <p className="text-muted-foreground mb-4">Your payment was confirmed by Kapital Bank.</p>
              </>
            ) : isCancelled ? (
              <>
                <div className="w-20 h-20 mx-auto bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="w-10 h-10 text-yellow-600" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Payment Cancelled</h1>
                <p className="text-muted-foreground mb-4">Your payment was not completed. You can try again.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Payment Failed</h1>
                <p className="text-muted-foreground mb-4">There was a problem verifying the payment. Please contact support.</p>
              </>
            )}

            {orderId && <p className="text-sm text-muted-foreground mb-4">Order ID: <strong>{orderId}</strong></p>}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
            >
              Continue Shopping
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentResultPage;