"use client"
import {
  useState
} from "react"
import {
  toast
} from "sonner"
import {
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import {
  z
} from "zod"
import {
  cn
} from "@/lib/utils"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Input
} from "@/components/ui/input"
import {
  Textarea
} from "@/components/ui/textarea"
import {
  Switch
} from "@/components/ui/switch"
import { CreateNewClassFormData } from "@/types/class.type"

const createNewClassFormSchema = z.object({
  class_code: z.string().min(1).min(1).max(99),
  class_name: z.string().min(1).min(1).max(256),
  class_desc: z.string().optional(),
  is_active: z.boolean()
});

interface CreateNewClassInterface {
  onSubmit: (updatedClass: CreateNewClassFormData) => void;
  initialData?: CreateNewClassFormData | null
}

export default function CreateNewClassForm({
  onSubmit,
  initialData
}: CreateNewClassInterface) {

  const form = useForm < z.infer < typeof createNewClassFormSchema >> ({
    resolver: zodResolver(createNewClassFormSchema),

  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        
        <FormField
          control={form.control}
          name="class_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode</FormLabel>
              <FormControl>
                <Input 
                placeholder="1"
                
                type="text"
                {...field} />
              </FormControl>
              <FormDescription>Kode kelas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="class_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kelas</FormLabel>
              <FormControl>
                <Input 
                placeholder="Merapi"
                
                type="text"
                {...field} />
              </FormControl>
              <FormDescription>Nama dari kelas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="class_desc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Placeholder"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Deskripsi kelas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
          <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Rombel Aktif?</FormLabel>
                    <FormDescription>Apakah Rombongan Belajar ini aktif? </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}