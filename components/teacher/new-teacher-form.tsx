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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  format
} from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Calendar
} from "@/components/ui/calendar"
import {
  Calendar as CalendarIcon
} from "lucide-react"
import {
  PhoneInput
} from "@/components/ui/phone-input";
import {
  Switch
} from "@/components/ui/switch"
import { CreateNewTeacherFormData } from "@/types/teacher.type"

const createNewTeacherFormData = z.object({
  id: z.string().min(1),
  nip: z.number(),
  salutation: z.string(),
  fullName: z.string().min(1),
  birthDate: z.date(),
  phoneNumber: z.string(),
  isSupervisor: z.boolean()
});

interface CreateNewTeacherInterface {
  onSubmit: (updatedClass: CreateNewTeacherFormData) => void;
  initialData?: CreateNewTeacherFormData | null
}

export default function NewTeacherForm({
  onSubmit,
  initialData
}: CreateNewTeacherInterface) {

  const form = useForm<z.infer<typeof createNewTeacherFormData>>({
    resolver: zodResolver(createNewTeacherFormData),
    defaultValues: {
      "birthDate": new Date()
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl mx-auto py-0">

        <div className="grid grid-cols-12 gap-4">

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Guru</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456"

                      type="text"
                      {...field} />
                  </FormControl>
                  <FormDescription>Kode Guru</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">

          <div className="col-span-6">

            <FormField
              control={form.control}
              name="salutation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sapaan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Bapak">Bapak</SelectItem>
                      <SelectItem value="Ibu">Ibu</SelectItem>
                      <SelectItem value="dr.">dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Sapaan GTK</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">

            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP / NUPTK</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="xxxxxxxxxxx"

                      type="number"
                      {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </div>

        <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Hanya Contoh, S.Pd"

                      type="text"
                      {...field} />
                  </FormControl>
                  <FormDescription>Nama lengkap guru dan Gelar</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Lahir</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Tanggal lahir guru</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel>Nomor WA</FormLabel>
              <FormControl className="w-full">
                <PhoneInput
                  placeholder="08xxxxxxxx"
                  {...field}
                  defaultCountry="ID"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Nomor WA dari guru</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="isSupervisor"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Supervisor</FormLabel>
                <FormDescription>Apakah guru berikut adalah supervisor?</FormDescription>
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