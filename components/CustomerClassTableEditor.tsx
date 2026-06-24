"use client";

import { useState } from "react";
import {
  addCustomerClass,
  normalizeCustomerClassName,
  removeCustomerClass,
  renameCustomerClass
} from "@/lib/customer-classes";

type CustomerClassTableEditorProps = {
  customerClasses: string[];
  onChange: (customerClasses: string[]) => void;
};

export function CustomerClassTableEditor({
  customerClasses,
  onChange
}: CustomerClassTableEditorProps) {
  const [newClassName, setNewClassName] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [message, setMessage] = useState("");

  function handleAdd() {
    const nextClassName = normalizeCustomerClassName(newClassName);
    const nextClasses = addCustomerClass(customerClasses, nextClassName);

    if (nextClasses === customerClasses) {
      setMessage(nextClassName ? "Customer class already exists." : "Enter a customer class name.");
      return;
    }

    onChange(nextClasses);
    setNewClassName("");
    setMessage("");
  }

  function startEditing(customerClass: string) {
    setEditingClassName(customerClass);
    setEditingValue(customerClass);
    setMessage("");
  }

  function saveEditing() {
    const nextClasses = renameCustomerClass(customerClasses, editingClassName, editingValue);

    if (nextClasses === customerClasses) {
      setMessage("Enter a unique customer class name.");
      return;
    }

    onChange(nextClasses);
    setEditingClassName("");
    setEditingValue("");
    setMessage("");
  }

  function handleRemove(customerClass: string) {
    const nextClasses = removeCustomerClass(customerClasses, customerClass);

    if (nextClasses === customerClasses) {
      setMessage("At least one customer class is required.");
      return;
    }

    onChange(nextClasses);
    setMessage("");
  }

  return (
    <section className="rounded-md border border-line p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="text-sm font-medium">Add customer class</span>
          <input
            type="text"
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
        >
          Add
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-ink/60">
            <tr>
              <th className="py-2 pr-4 font-medium">Customer class</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customerClasses.map((customerClass) => (
              <tr key={customerClass} className="border-b border-line last:border-b-0">
                <td className="py-2 pr-4">
                  {editingClassName === customerClass ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      className="w-full min-w-48 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  ) : (
                    customerClass
                  )}
                </td>
                <td className="py-2 pr-4 text-ink/70">Tariff input class</td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    {editingClassName === customerClass ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold hover:border-semarts"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClassName("");
                            setEditingValue("");
                          }}
                          className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold hover:border-semarts"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(customerClass)}
                          className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold hover:border-semarts"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(customerClass)}
                          className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold hover:border-red-500"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-red-700">{message}</p> : null}
    </section>
  );
}
