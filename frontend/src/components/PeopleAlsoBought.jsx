import ProductCard from "./ProductCard";

const PeopleAlsoBought = () => {
  const recommendations = [
    {
      id: 1,
      name: "Wireless Earbuds",
      description: "Noise-cancelling wireless earbuds",
      price: 49.99,
      category: "Electronics",
      image: "https://img.freepik.com/free-photo/simple-black-t-shirt-worn-by-man_53876-102772.jpg?size=626&ext=jpg&ga=GA1.1.57607395.1724050320&semt=ais_hybrid"
    },
    {
      id: 2,
      name: "Smart Watch",
      description: "Fitness tracking smartwatch",
      price: 99.99,
      category: "Wearable Tech",
      image: "https://img.freepik.com/premium-photo/blank-white-tshirt-template-design_1314592-20973.jpg?size=626&ext=jpg&ga=GA1.1.57607395.1724050320&semt=ais_hybrid"
    },
  ];

  return (
    <div className='mt-8'>
      <h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
      <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg: grid-col-3'>
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default PeopleAlsoBought
