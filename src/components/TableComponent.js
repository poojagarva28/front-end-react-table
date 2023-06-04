import React, { useEffect, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import axios from "axios";
import "./TableComponent.css";

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("id", {
    header: "No.",
    cell: (info, rowIndex) => parseInt(info.row.id) + 1,
    enableSorting: false,
  }),
  // columnHelper.accessor("name", {
  //   header: "Name",
  // }),
  // columnHelper.accessor("image", {
  //   header: "Image",
  //   enableSorting: false,
  // }),
  // columnHelper.accessor("description", {
  //   header: "Description",
  //   enableSorting: false,
  // }),
  columnHelper.accessor("category", {
    header: "Category",
  }),
  // columnHelper.accessor("label", {
  //   header: "Label",
  //   enableSorting: false,
  // }),
  columnHelper.accessor("items", {
    header: "Name",
    cell: (item) => item.row.original.items.map((i) => i.name).join(", "),
  }),
  columnHelper.accessor(
    (info) => {
      return info.items.map((i) => Object.keys(i).find((j) => j === "price"));
    },
    {
      header: "Price",
      cell: (info, rowIndex) => (
        <>
          <EditableCell
            value={info.row.original.items
              .map((i) => i.price)
              .reduce((total, price) => total + parseFloat(price), 0)}
            rowIndex={info.row.original.category}
            id={info.row.original.category}
          />
        </>
      ),
    }
  ),
];

const EditableCell = ({ value, rowIndex, id, onSave }) => {
  const [cellValue, setCellValue] = useState(value);

  const handlePriceChange = (event) => {
    const newValue = event.target.value;
    setCellValue(newValue);
  };

  useEffect(() => {
    // Retrieve the edited price value from local storage
    const editedPrice = localStorage.getItem(`edited_price_${id}`);
    if (editedPrice) {
      setCellValue(editedPrice);
    }
  }, [id]);

  const handleBlur = () => {
    // Save the edited price value to local storage
    localStorage.setItem(`edited_price_${id}`, cellValue);
  };

  return (
    <input
      type="text"
      value={cellValue}
      onChange={handlePriceChange}
      onBlur={handleBlur}
    />
  );
};

const TableComponent = () => {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [grouping, setGrouping] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [render, setRerender] = useState(true);

  const getData = async () => {
    const result = await axios.get(
      "https://s3-ap-southeast-1.amazonaws.com/he-public-data/reciped9d7b8c.json"
    );
    setData(result.data);
    setOriginalData(result.data);

    const resultData = result.data;

    // const groupedData = resultData.reduce((result, item) => {
    //   const category = item.category || "uncategorized";
    //   console.log(category, "category");
    //   if (!result[category]) {
    //     result[category] = {
    //       items: [],
    //       total: 0,
    //       // Include other fields you want here
    //       category: category,
    //       label: item.label || "",
    //     };
    //   }
    //   result[category].items.push(item);
    //   result[category].total += parseFloat(item.price);
    //   return result;
    // }, {});
    // console.log(groupedData, "groupedData");

    if (!resultData) {
      // Handle the case when the response is undefined or empty
      return;
    }

    // Group the data by category
    const groupedData = resultData.reduce((result, item) => {
      if (!result[item.category]) {
        result[item.category] = {
          category: item.category,
          items: [],
        };
      }
      result[item.category].items.push(item);
      return result;
    }, {});

    // Convert the groupedData object into an array of category objects
    const groupedResult = Object.values(groupedData);

    // Set the result into the state
    console.log(groupedResult, "groupedResult");
    setData(groupedResult);
    setOriginalData(groupedResult);
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSave = () => {
    data.forEach((row) => {});
  };

  const handleReset = () => {
    // Clear the edited price values from local storage
    setRerender(false);
    data.forEach((row) => {
      console.log(row, "remove");
      localStorage.removeItem(`edited_price_${row.category}`);
    });
    // Reset the data to the original data
    setData(originalData);
    setRerender(true);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      grouping,
    },
    onGroupingChange: setGrouping,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <div className="p-2">
      <div className="container">
        <div className="table-container">
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="buttons-container">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleReset}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;
