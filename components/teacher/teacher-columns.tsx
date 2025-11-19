"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "../ui/switch";
import { CreateNewTeacherFormData } from "@/types/teacher.type";

  interface ColumnActions {
    onEdit?: (data: CreateNewTeacherFormData) => void;
    onDelete?: (id: string) => void;
  }

  export const createColumns = (): ColumnDef<CreateNewTeacherFormData>[] => {
    const columns: ColumnDef<CreateNewTeacherFormData>[] = [
      {
      accessorKey: "id",
      header: "Kode Guru",
      },
      {
        accessorKey: "fullName",
        header: "Nama Guru",
      },
      {
        accessorKey: "phoneNumber",
        header: "No. WA",
      },
      {
        accessorKey: "isSupervisor",
        header: "Supervisor?",
        cell: ({ row }) => {
          const isActive = row.getValue("isSupervisor");
          return <Switch checked={isActive === true} />;
        }
      },
    ];

    columns.push({
      id: "actions",
      cell: ({ row, table }) => {
        const record = row.original;
        const { onEdit, onDelete } = table.options.meta as ColumnActions;
  
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              
              {onEdit && <DropdownMenuItem onClick={() => onEdit(record)}>
                Ubah
              </DropdownMenuItem>}
              
              {onDelete && <DropdownMenuItem onClick={() => onDelete(record.id)}>
                Hapus
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    return columns;
  };