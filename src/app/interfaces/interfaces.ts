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
        profilePicFilename: string,
    },
    patient: null | {
        id: number,
        name: string,
        whatsappNumber: string,
        dob: Date,
    }
}

export interface AppointmentWithSlots extends Appointment {
    slots: {
        status: 'LOADING' | 'NOT_FOUND' | 'ERROR' | 'FOUND' | 'DOC_NOT_ACTIVE',
        list: DoctorAppointmentSlot[][][],
        selectedWeekIndex: number,
        selectedDayIndex: number,
        selectedSlotIndex: number,
    },
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

export interface PayfastPaymentGatewayParamItem {
    sku: string,
    name: string,
    price: number,
    qty: number
}

export interface PayfastPaymentGatewayParams {
    token: string,
    currencyCode: string,
    merchantId: string,
    merchantName: string,
    basketId: number,
    txnamt: number,
    orderDate: string,
    successUrl: string,
    failureUrl: string,
    checkoutUrl: string,
    formUrl: string,
    txndesc: string,
    procCode: string,
    tranType: string,
    customerMobileNo: string,
    customerEmailAddress: string,
    signature: string,
    version: string,
    items: PayfastPaymentGatewayParamItem[],
}

export type WithdrawalTransactionRequestStatus = 'REQUESTED' | 'REJECTED' | 'COMPLETED';

export type DoctorWithdrawalTransactionRequestStatus = 'REQUESTED' | 'REJECTED' | 'COMPLETED';

export type WithdrawalTransactionRequest = {
    amount: number,
    id: number,
    receiverEpNb: string,
    receiverEpUsername: string,
    rejectionReason: string,
    requestTime: Date,
    senderEpNb: string,
    senderEpUsername: string,
    status: WithdrawalTransactionRequestStatus,
    trxId: string,
    trxTime: Date | null
} & ({ patientId: number } | { doctorId: number });
