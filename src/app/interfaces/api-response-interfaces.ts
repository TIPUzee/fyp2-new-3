import {
    Appointment,
    DoctorProfile,
    DoctorReviews,
    Language,
    PatientProfileInterface,
    RegistrableUserType,
    SpecializationCategory,
    UserTypeInterface,
    DoctorAnalytics,
    DoctorAppointmentSlot,
    Doctor,
    PayfastPaymentGatewayParams,
    PatientRefundTransactionRequest, AppointmentStatus, PatientAccountStatus, DoctorAccountStatus
} from "./interfaces";

export interface LoadPatientProfileResponse {
    profile: PatientProfileInterface,
    userType: UserTypeInterface,
}

export interface AuthVerifyLoginsResponse {
    invalidLogin: boolean,
    userType: UserTypeInterface,
    accountSuspended: boolean,
}

export interface AuthRegisVerifyCodeResponse {
    invalidCode: boolean,
}

export interface AuthLoginResponse {
    invalidCredentials: boolean,
    accountSuspended: boolean,
    loginSuccessful: boolean,
    token: string,
    userType: UserTypeInterface,
}

export interface EmailExistsResponse {
    emailExists: boolean
}

export interface WhatsappNumberExistsResponse {
    whatsappNumberExists: boolean
}

export interface AuthRegisS1Response {
    emailAlreadyExists: boolean,
    whatsappNumberAlreadyExists: boolean,
    registrationCompleted: boolean,
    userType: RegistrableUserType,
    token: string,
}

export interface AuthRegisS2Response {
    invalidCode: boolean,
    whatsappNumberAlreadyExists: boolean,
    emailAlreadyExists: boolean,
    registrationCompleted: boolean,
    token: string,
    userType: RegistrableUserType,
}

export interface GetTempTokenResponse {
    tokenNotGenerated: boolean,
    token: string
}

export interface PatientProfileUpdateResponse {
    emailExists: boolean,
    whatsappNumberExists: boolean,
    invalidOldPassword: boolean,
    profileUpdated: boolean
}

export interface LoadDoctorProfileResponse {
    userType: UserTypeInterface,
    profile: DoctorProfile
}

export interface LoadLanguagesResponse {
    languages: Language[],
}

export interface LoadSpecializationCategoriesResponse {
    categories: SpecializationCategory[]
}

export interface DoctorProfileUpdateResponse {
    emailAlreadyExists: boolean,
    whatsappNumberAlreadyExists: boolean,
    invalidOldPassword: boolean,
    invalidSpecializationCategoryId: boolean,
    invalidLanguages: boolean,
    profileUpdated: boolean,
}

export interface MarkAppointmentAsCompletedResponse {
    appointmentNotExists: boolean,
    invalidSecretCode: boolean,
    notCompletable: boolean,
    markedAsCompleted: boolean,
    alreadyCompleted: boolean,
}

export interface DelayAppointmentResponse {
    appointmentNotExists: boolean,
    notDelayable: boolean,
    alreadyDelayed: boolean,
    maxDelayReached: boolean,
    delayed: boolean,
}

export interface DoctorNotJoinedAppointmentResponse {
    appointmentNotExists: boolean,
    statusNotChangeable: boolean,
    markedAsDoctorNotJoined: boolean,
    alreadyMarkedAsDoctorNotJoined: boolean,
}

export interface CancelAppointmentResponse {
    appointmentNotExists: boolean,
    notCancelable: boolean,
    alreadyCancelledByPat: boolean,
    alreadyCancelledByDoc: boolean,
    cancelOperationDone: boolean,
}

export interface LoadAppointmentsResponse {
    appointments: Appointment[]
}

export interface PatientNotJoinedAppointmentResponse {
    appointmentNotExists: boolean,
    statusNotChangeable: boolean,
    attempt1VideoNotUploaded: boolean,
    attempt2VideoNotUploaded: boolean,
    attempt1VideoNotVideo: boolean,
    attempt2VideoNotVideo: boolean,
    attempt1VideoSizeExceeded: boolean,
    attempt2VideoSizeExceeded: boolean,
    requestAlreadyApproved: boolean,
    requestAlreadyRejected: boolean,
    requestAlreadySubmitted: boolean,
    requestSubmitted: boolean,
}

export interface GetDoctorDetailsResponse {
    doctorNotFound: boolean,
    doctor: DoctorProfile,
}

export interface GetDoctorReviewsResponse {
    list: DoctorReviews[],
    nextOffset: number,
    limitPerLoad: number,
}

export interface GetDoctorAnalyticsResponse extends DoctorAnalytics {
    doctorNotFound: boolean,
}

export interface GetDoctorAppointmentSlotsResponse {
    doctorNotFound: boolean,
    doctorNotActive: boolean,
    appointmentSlots: DoctorAppointmentSlot[][][],
}

export interface GetAllDoctorsResponse {
    list: Doctor[]
}

export interface BookAppointmentResponse {
    doctorNotExists: boolean,
    doctorNotActive: boolean,
    invalidSlot: boolean,
    slotClash: boolean,
    appointmentBooked: boolean,
    appointmentToken: string,
}

export interface VerifyAppointmentBookingTokenResponse {
    invalidToken: boolean,
    doctorNotExists: boolean,
    doctorNotActive: boolean,
    invalidSlot: boolean,
    slotClash: boolean,
    appointmentAlreadyBooked: boolean,
    verified: boolean,
}

export interface GetAppointmentBookingPaymentParamsResponse {
    invalidToken: boolean,
    doctorNotExists: boolean,
    doctorNotActive: boolean,
    invalidSlot: boolean,
    slotClash: boolean,
    appointmentAlreadyBooked: boolean,
    verified: boolean,
    paramsGenerated: boolean,
    payfastParams: PayfastPaymentGatewayParams,
}

export interface RescheduleAppointmentResponse {
    appointmentNotExists: boolean,
    notReschedulable: boolean,
    doctorNotActive: boolean,
    doctorNotExists: boolean,
    invalidSlot: boolean,
    maxRescheduleReached: boolean,
    rescheduled: boolean,
    slotClash: boolean
}

export interface SubmitPatientReviewResponse {
    appointmentNotExists: boolean,
    alreadyReviewed: boolean,
    cannotReview: boolean,
    reviewedSuccessfully: boolean,
}

export interface SubmitPatientRefundTransactionRequestResponse {
    minAmount: number,
    minAmountNotMet: boolean,
    alreadyRequested: boolean,
    success: boolean,
}

export interface GetPrevPatientRefundTransactionRequestResponse {
    neverRequested: boolean,
    alreadyRequested: boolean,
    prevRejected: boolean,
    prevCompleted: boolean,
    requestDetails: PatientRefundTransactionRequest,
}

export type GetAppointmentTransactionsResponse = {
    transactions: {
        doctor: {
            id: number,
            name: string
        },
        doctorId: number,
        id: number,
        paidAmount: number,
        refundedAmount: number,
        paymentTime: Date,
        status: AppointmentStatus,
        timeFrom: Date,
        timeTo: Date,
    }[]
}

export type GetPatientRefundTransactionsResponse = {
    noTransactions: false,
    refundTransactions:
        {
            amount: number,
            id: number,
            receiverEpNb: string,
            receiverEpUsername: string,
            rejectionReason: string,
            requestTime: Date,
            senderEpNb: string,
            senderEpUsername: string,
            trxId: string,
            trxTime: Date
        }[]
}

export interface GetAllPatientsResponse {
    patients: Array<{
        dob: Date,
        email: string,
        id: number,
        name: string,
        password: string,
        refundableAmount: number,
        registrationTime: Date,
        status: PatientAccountStatus,
        whatsappNumber: string,
    }>,
}

export interface AdminUpdatePatientResponse {
    emailAlreadyExists: boolean,
    patientNotFound: boolean,
    patientUpdated: boolean
}

export interface AdminUpdateDoctorResponse {
    emailAlreadyExists: boolean,
    doctorNotFound: boolean,
    doctorUpdated: boolean
}

export interface AllGetAllDoctorsResponse {
    doctors: {
        activeForAppointments: number,
        appointmentCharges: number,
        coverPicFilename: string,
        dob: Date,
        email: string,
        id: number,
        maxMeetingDuration: number,
        name: string,
        password: string,
        profilePicFilename: string,
        registrationTime: Date,
        specialization: string,
        specializationCategoryId: number,
        status: DoctorAccountStatus,
        statusChangeTime: Date,
        walletAmount: number,
        whatsappNumber: string
    }[]
}

export interface AdminGetDoctorApprovalDocumentsResponse {
    doctorNotFound: boolean,
    docs: string[],
}

export interface AdminGetAppointmentsResponse {
    appointments: {
        delayCountByDoc: number,
        doctorId: number,
        doctorReport: string,
        id: number,
        paidAmount: number,
        patientId: number,
        patientReview: string,
        paymentTime: Date,
        rating: number,
        refundedAmount: number,
        rescheduleCountByPat: number,
        secretCode: string,
        status: AppointmentStatus,
        statusChangeTime: Date,
        symptomDescription: string,
        timeFrom: Date,
        timeTo: Date
    }[],
}

export interface AdminRejectPatientNotJoinedRequestResponse {
    appointmentNotExists: boolean,
    statusNotChangeable: boolean,
    alreadyMarkedAsPatientNotJoinedReject: boolean,
    markedAsPatientNotJoinedReject: boolean,
}

export interface AdminGetPatientNotJoinedProofVideosResponse {
    appointmentNotExists: boolean,
    statusNotSuitable: boolean,
    videos: string[],
}
