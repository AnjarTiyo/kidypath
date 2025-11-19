"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { createColumns } from "./teacher-columns";
import { DataTable } from "../ui/data-table";
import { CreateNewTeacherFormData } from "@/types/teacher.type";
import NewTeacherForm from "./new-teacher-form";

// Temporary dummy data
const initialData: CreateNewTeacherFormData[] = [
  {
    id: "1",
    nip: 123456,
    salutation: "Mr.",
    fullName: "John Doe",
    birthDate: new Date(),
    phoneNumber: "1234567890",
    isSupervisor: true
  },
];

export default function TeacherTableContainer() {
  const [data, setData] = useState<CreateNewTeacherFormData[]>(initialData);
  const [editingUser, setEditingUser] =
    useState<CreateNewTeacherFormData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const columns = createColumns();

  const handleCreate = (
    newRecord: Omit<CreateNewTeacherFormData, "id">
  ) => {
    const record = { ...newRecord, id: String(data.length + 1) };
    setData([...data, record]);
    setIsSheetOpen(false);
  };

  const handleUpdate = (updatedTeacher: CreateNewTeacherFormData) => {
    setData(
      data.map((record) =>
        record.id === updatedTeacher.id ? updatedTeacher : record
      )
    );
    setIsSheetOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    setData(data.filter((record) => record.id !== id));
  };

  const handlemultiDelete = (teachers: CreateNewTeacherFormData[]) => {
    const userIds = new Set(teachers.map((record) => record.id));
    setData(data.filter((record) => !userIds.has(record.id)));
  };

  const handleEdit = (record: CreateNewTeacherFormData) => {
    setEditingUser(record);
    setIsSheetOpen(true);
  };

  const openCreateSheet = () => {
    setEditingUser(null);
    setIsSheetOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-[450px] sm:w-[500px] px-8 py-4 flex flex-col"
        >
          {/* Header tetap di atas */}
          <SheetHeader className="space-y-1 flex-shrink-0">
            <SheetTitle>
              {editingUser ? "Ubah Data Guru" : "Buat Data Guru Baru"}
            </SheetTitle>
            <SheetDescription>
              Please fill out the form below to{" "}
              {editingUser ? "update the data" : "create a new data"}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <NewTeacherForm
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
