const Table = ({
  columns,
  renderRow,
  data,
  renderCard,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  renderCard?: (item: any) => React.ReactNode;
}) => {
  return (
    <div className="w-full">
      {/* MOBILE TILES VIEW */}
      {renderCard ? (
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:hidden">
          {data.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center text-sm text-gray-400">
              No records found.
            </div>
          ) : (
            data.map((item) => renderCard(item))
          )}
        </div>
      ) : null}

      {/* DESKTOP / TABLET TABLE VIEW */}
      <div className={`w-full overflow-x-auto ${renderCard ? "hidden md:block" : "block"}`}>
        <table className="mt-4 w-full min-w-[600px] md:min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              {columns.map((col) => (
                <th key={col.accessor} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-sm text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => renderRow(item))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
