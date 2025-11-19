"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CreateNewClassFormData } from "@/types/class.type";
import { createColumns } from "./class-columns";
import CreateNewClassForm from "./new-class-form";
import { DataTable } from "../ui/data-table";

// Temporary dummy data
const initialData: CreateNewClassFormData[] = [
  {
    class_code: "A",
    class_name: "A",
    class_desc: "A",
    is_active: true,
  },
];

export default function CreateNewClassTableContainer() {
  const [data, setData] = useState<CreateNewClassFormData[]>(initialData);
  const [editingUser, setEditingUser] =
    useState<CreateNewClassFormData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const columns = createColumns();

  const handleCreate = (
    newRecord: Omit<CreateNewClassFormData, "class_code">
  ) => {
    const record = { ...newRecord, class_code: String(data.length + 1) };
    setData([...data, record]);
    setIsSheetOpen(false);
  };

  const handleUpdate = (updatedClass: CreateNewClassFormData) => {
    setData(
      data.map((record) =>
        record.class_code === updatedClass.class_code ? updatedClass : record
      )
    );
    setIsSheetOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    setData(data.filter((record) => record.class_code !== id));
  };

  const handlemultiDelete = (classes: CreateNewClassFormData[]) => {
    const userIds = new Set(classes.map((record) => record.class_code));
    setData(data.filter((record) => !userIds.has(record.class_code)));
  };

  const handleEdit = (record: CreateNewClassFormData) => {
    setEditingUser(record);
    setIsSheetOpen(true);
  };

  const openCreateSheet = () => {
    setEditingUser(null);
    setIsSheetOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[450px] sm:w-[500px] px-8 py-4">
          <SheetHeader>
            <SheetTitle>{editingUser ? "Edit Class" : "Create New Class"}</SheetTitle>
            <SheetDescription>
              Please fill out the form below to{" "}
              {editingUser ? "update the data" : "create a new data"}.
            </SheetDescription>
          </SheetHeader>

          <div>
            <CreateNewClassForm
              onSubmit={editingUser ? handleUpdate : handleCreate}
              initialData={editingUser}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={data}
        onAdd={openCreateSheet}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onmultiDelete={handlemultiDelete}
      />
    </div>
  );
}
