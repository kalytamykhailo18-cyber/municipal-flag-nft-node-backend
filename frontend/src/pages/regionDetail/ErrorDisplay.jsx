/**
 * Error Display - Displayed when region not found
 */
const ErrorDisplay = ({ message }) => {
  return (
    <div className="page-container">
      <div
        data-animate="zoom-in"
        data-duration="fast"
        className="text-center py-16"
      >
        <p className="text-red-400">{message}</p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
