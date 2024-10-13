import React from 'react'
import CategoryItem from "../components/CategoryItem"

const HomePage = () => {

  const categories = [
    // { href: "/jeans", name: "Jeans", imageUrl: "https://images.pexels.com/photos/603022/pexels-photo-603022.jpeg?cs=srgb&dl=pexels-neosiam-603022.jpg&fm=jpg" },
    { href: "/t-shirts", name: "T-shirts", imageUrl: "https://cdn.pixabay.com/photo/2024/04/29/04/21/tshirt-8726716_640.jpg" },
    { href: "/shoes", name: "Shoes", imageUrl: "https://t3.ftcdn.net/jpg/06/12/00/18/360_F_612001823_TkzT0xmIgagoDCyQ0yuJYEGu8j6VNVYT.jpg" },
    { href: "/glasses", name: "Glasses", imageUrl: "https://img.freepik.com/free-photo/eyeglasses-sunglasses-reflecting-summer-elegance-design-generated-by-ai_188544-19634.jpg" },
    { href: "/jackets", name: "Jackets", imageUrl: "https://images.unsplash.com/photo-1675877879221-871aa9f7c314?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8amFja2V0JTIwbWVufGVufDB8fDB8fHww" },
    { href: "/suits", name: "Suits", imageUrl: "https://img.freepik.com/free-vector/mans-suit-realistic-composition-with-smart-costume-with-white-shirt-tie-jacket_1284-54345.jpg?size=338&ext=jpg&ga=GA1.1.2008272138.1726012800&semt=ais_hybrid" },
    { href: "/bags", name: "Bags", imageUrl: "https://t4.ftcdn.net/jpg/01/10/04/51/360_F_110045173_QgmA3gg5OwTlLNQBqmPdFnkh6sPvsvt8.jpg" },
  ];

  return (
    <div className='relative min-h-screen text-white overflow-hidden'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
          Explore Our Categories
        </h1>
        <p className='text-center text-xl text-gray-300 mb-12'>
          Discover the latest trends in eco-friendly fashion
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>
        {/* {!isLoading && products.length > 0 && <FeaturedProducts featuredProducts={products} />} */}
      </div>
    </div>
  )
}

export default HomePage
