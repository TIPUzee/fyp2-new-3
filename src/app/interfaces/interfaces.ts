export type UserTypeInterface = 'g' | 'p' | 'd' | 'a';
export type RegistrableUserType = 'p' | 'd';

export type PatientAccountStatus = 'ACCOUNT_SUSPENDED' | 'ACCOUNT_NOT_SUSPENDED';
export type DoctorAccountStatus =
    'NEW_ACCOUNT'
    | 'ACCOUNT_SUSPENDED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_REJECTED'
    | 'ACCOUNT_APPROVED';

export interface PatientProfileInterface {
    id: number,
    name: string,
    email: string,
    phone: string,
    whatsappNumber: string,
    dob: string,
    registrationTime: string,
    refundableAmount: number,
    status: PatientAccountStatus,
}

export interface Doctor {
    id: number,
    profilePicFilename: string | null,
    coverPicFilename: string | null,
    name: string,
    dob: Date,
    registrationTime: string,
    status: DoctorAccountStatus,
    specializationCategoryId: number | null,
    maxMeetingDuration: number,
    appointmentCharges: number,
    specialization: string,
    languages: DoctorLanguage[],
}

export interface DoctorProfile extends Doctor {
    email: string,
    whatsappNumber: string,
    walletAmount: number,
    availabilityDurations: DoctorAvailabilityDuration[],
    experiences: DoctorExperience[]
}

export interface DoctorAvailabilityDuration {
    from: number,
    to: number,
    enabled: boolean
}

export interface DoctorLanguage {
    id: number,
    languageId: number,
}

export interface Language {
    id: number,
    title: string,
}

export interface DoctorExperience {
    title: string,
    description: string,
    dateFrom: Date,
    dateTo: Date | null
}

export interface SpecializationCategory {
    id: number,
    title: string
}

export type AppointmentStatus =
    'PAT_CANCELLED'
    | 'PAT_NOT_JOINED_REQ'
    | 'PAT_NOT_JOINED_REJ'
    | 'PAT_NOT_JOINED'
    | 'DOC_CANCELLED'
    | 'DOC_REQUESTED_DELAY'
    | 'DOC_NOT_JOINED'
    | 'SLOT_CLASH'
    | 'PENDING'
    | 'COMPLETED';

export interface Appointment {
    id: number,
    doctorId: number,
    patientId: number,
    symptomDescription: string,
    timeFrom: Date,
    timeTo: Date,
    paidAmount: number,
    status: AppointmentStatus,
    statusChangeTime: Date,
    delayCountByDoc: number,
    rescheduleCountByPat: number,
    paymentTime: Date,
    doctorReport: string,
    patientReview: string,
    rating: number,
    secretCode: string,
    refundedAmount: number,
    doctor: null | {
        id: number,
        name: string,
    },
    patient: null | {
        id: number,
        name: string,
        whatsappNumber: string,
        dob: Date,
    }
}

export interface DoctorReviews {
    patientReview: string,
    rating: number,
    id: number,
    timeTo: Date,
}

export interface DoctorAnalytics {
    ratingAnalytics: {
        totalAppointments: number,
        rating1Star: number,
        rating2Star: number,
        rating3Star: number,
        rating4Star: number,
        rating5Star: number,
        days: number,
    },
    nbOfAppointAnalytics: {
        weeks: number,
        totalAppointments: number,
        completedAppoints: {
            total: number,
            weekVice: number[]
        },
        docCancelledAppoints: {
            total: number,
            weekVice: number[]
        },
        docNotJoinedAppoints: {
            total: number,
            weekVice: number[]
        },
    },
}

export interface DoctorAppointmentSlot {
    timeFrom: Date,
    timeTo: Date,
}
