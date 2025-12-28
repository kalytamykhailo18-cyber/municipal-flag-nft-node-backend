/**
 * Loading Component
 */
const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-gray-400">{text}</p>
    </div>
  );
};

export default Loading;
