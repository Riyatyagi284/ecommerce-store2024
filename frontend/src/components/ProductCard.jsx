import { ShoppingCart } from "lucide-react";
import CartItem from "./CartItem";

const ProductCard = ({ setCartItem, product }) => {

  const handleAddToCart = (product) => {
    setCartItem(previousCartItem => {
      // Check if the product is already in the cart using findIndex
      const existingProductIndex = previousCartItem.findIndex(item => item.id === product.id);

      if (existingProductIndex !== -1) {
        // If product exists, update the quantity
        return previousCartItem.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add the new product with quantity 1
        return [...previousCartItem, { ...product, quantity: 1 }];
      }
    });
  };


  return (
    <div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg'>
      <div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
        <img className='object-cover w-full' src={product.image} alt='product image' />
        <div className='absolute inset-0 bg-black bg-opacity-20' />
      </div>

      <div className='mt-4 px-5 pb-5'>
        <h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
        <div className='mt-2 mb-5 flex items-center justify-between'>
          <p>
            <span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
          </p>
        </div>
        <button
          className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium
					 text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300'
          onClick={() => handleAddToCart(product)}
        >
          <ShoppingCart size={22} className='mr-2' />
          Add to cart
        </button>
      </div>
    </div>
  )

}
export default ProductCard
