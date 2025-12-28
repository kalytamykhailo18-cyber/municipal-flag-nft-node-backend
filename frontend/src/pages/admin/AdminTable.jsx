/**
 * AdminTable - Reusable table component for admin CRUD operations
 */

const AdminTable = ({ columns, data, emptyMessage = 'No items found.' }) => {
  return (
    <div className="card overflow-x-auto" data-animate="fade-up" data-duration="normal">
      <table className="w-full">
        <thead className="bg-dark-darker">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-gray-400 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-800/50">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-500">{emptyMessage}</div>
      )}
    </div>
  );
};

export default AdminTable;
