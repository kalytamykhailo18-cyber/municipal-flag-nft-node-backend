/**
 * Categories - Flag categories section
 */
const Categories = () => {
  return (
    <section className="page-container py-16 bg-dark">
      <h2
        data-animate="fade-down"
        data-duration="normal"
        className="section-title text-center"
      >
        Flag Categories
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div
          data-animate="fade-right"
          data-duration="normal"
          className="card card-animate p-6 border-gray-600"
        >
          <h3 className="text-white font-bold text-xl mb-2">Standard</h3>
          <p className="text-gray-400">Base flags with no special benefits</p>
        </div>
        <div
          data-animate="fade-up"
          data-duration="normal"
          className="card card-animate p-6 border-blue-600"
        >
          <h3 className="text-blue-400 font-bold text-xl mb-2">Plus</h3>
          <p className="text-gray-400">50% discount on future Standard purchases</p>
        </div>
        <div
          data-animate="fade-left"
          data-duration="normal"
          className="card card-animate p-6 border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-amber-500/10"
        >
          <h3 className="text-yellow-400 font-bold text-xl mb-2">Premium</h3>
          <p className="text-gray-400">75% permanent discount on Standard flags</p>
        </div>
      </div>
    </section>
  );
};

export default Categories;
