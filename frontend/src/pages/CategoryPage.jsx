import { useState } from "react"
import { useParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { productsData } from "../data";
import ProductCard from "../components/ProductCard";
import { select } from "framer-motion/client";

const CategoryPage = ({cartItem, setCartItem}) => {
	const [products, setProducts] = useState(productsData);

	const { category } = useParams();

	const filteredProducts = productsData.find(data => data.category === category)?.products || [];

	return (
		<div className='min-h-screen'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{/* {category.charAt(0).toUpperCase() + category.slice(1)} */}
					CategoryName
				</motion.h1>

				<motion.div
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					{products?.length === 0 && (
						<h2 className='text-3xl font-semibold text-gray-300 text-center col-span-full'>
							No products found
						</h2>
					)}

					{filteredProducts?.map((product) => (
						<ProductCard key={product.id} product={product} setCartItem={setCartItem}/>
					))}

				</motion.div>
			</div>
		</div>
	)
}

export default CategoryPage
