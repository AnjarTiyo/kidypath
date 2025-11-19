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
import { CreateNewClassFormData } from "@/types/class.type";
import { Switch } from "../ui/switch";

  interface ColumnActions {
    onEdit?: (data: CreateNewClassFormData) => void;
    onDelete?: (id: string) => void;
  }

  export const createColumns = (): ColumnDef<CreateNewClassFormData>[] => {
    const columns: ColumnDef<CreateNewClassFormData>[] = [
      {
      accessorKey: "class_code",
      header: "Kode Rombel",
      },
      {
        accessorKey: "class_name",
        header: "Nama Rombel",
      },
      {
        accessorKey: "class_desc?",
        header: "Deskripsi Kelas",
      },
      {
        accessorKey: "is_active",
        header: "Aktif?",
        cell: ({ row }) => {
          const isActive = row.getValue("is_active");
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              {onEdit && <DropdownMenuItem onClick={() => onEdit(record)}>
                Edit
              </DropdownMenuItem>}
              
              {onDelete && <DropdownMenuItem onClick={() => onDelete(record.class_code)}>
                Delete
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    return columns;
  };