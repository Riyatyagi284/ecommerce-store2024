import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight, Origami } from "lucide-react";


const OrderSummary = ({ cartItem, isCouponApplied, AvailableCouponCode }) => {
  const [savings, setSavings] = useState(0)
  const [coupon, setCoupon] = useState(true)
  const navigate = useNavigate();

  const handlePayment = () => {
    // Placeholder for payment logic
    navigate('/purchase-success');
  }

  const originalPrice = cartItem.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  let reducedPrice = originalPrice*(8/100);
  let totalPrice =  originalPrice-reducedPrice;



  return (
    <motion.div
      className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className='text-xl font-semibold text-emerald-400'>Order summary</p>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <dl className='flex items-center justify-between gap-4'>
            <dt className='text-base font-normal text-gray-300'>Original price</dt>
            <dd className='text-base font-medium text-white'>${originalPrice}</dd>
          </dl>

          {savings > 0 && (
            <dl className='flex items-center justify-between gap-4'>
              <dt className='text-base font-normal text-gray-300'>Savings</dt>
              <dd className='text-base font-medium text-emerald-400'>-$80</dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className='flex items-center justify-between gap-4'>
              <dt className='text-base font-normal text-gray-300'>Coupon {AvailableCouponCode}</dt>
              <dd className='text-base font-medium text-emerald-400'>-8%</dd>
            </dl>
          )}
          <dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
            <dt className='text-base font-bold text-white'>Total</dt>
            <dd className='text-base font-bold text-emerald-400'>${isCouponApplied ? (totalPrice) : (originalPrice)}</dd>
          </dl>
        </div>

        <motion.button
          className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
        >
          Proceed to Checkout
        </motion.button>

        <div className='flex items-center justify-center gap-2'>
          <span className='text-sm font-normal text-gray-400'>or</span>
          <Link
            to='/'
            className='inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline'
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default OrderSummary
