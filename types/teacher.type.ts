export interface CreateNewTeacherFormData {
    id: string;
    nip: number;
    salutation: string;
    fullName: string;
    birthDate: Date;
    phoneNumber: string;
    isSupervisor: boolean;
}