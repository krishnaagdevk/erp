const Loading = () => {
  return (
    <div className="animate-pulse p-8">
      <div className="overflow-hidden rounded-lg shadow-md">
        <div className="flex space-x-32 bg-gray-200 p-8">
          <div className="h-6 w-1/6 rounded bg-gray-300"></div>
          <div className="h-6 w-2/6 rounded bg-gray-300"></div>
          <div className="h-6 w-1/6 rounded bg-gray-300"></div>
          <div className="h-6 w-1/6 rounded bg-gray-300"></div>
        </div>
        <div className="p-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="mb-4 mt-4 flex items-center justify-between py-2">
              <div className="mr-2 h-8 w-1/6 rounded bg-gray-200"></div>
              <div className="mr-2 h-8 w-2/6 rounded bg-gray-200"></div>
              <div className="mr-2 h-8 w-1/6 rounded bg-gray-200"></div>
              <div className="h-8 w-1/6 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
