import {
    Appointment,
    DoctorProfile,
    Language,
    PatientProfileInterface,
    RegistrableUserType,
    SpecializationCategory,
    UserTypeInterface
} from "./interfaces";

export interface LoadPatientProfileResponse {
    profile: PatientProfileInterface,
    userType: UserTypeInterface,
}

export interface AuthVerifyLoginsResponse {
    invalidLogin: boolean,
    userType: UserTypeInterface,
}

export interface AuthRegisVerifyCodeResponse {
    invalidCode: boolean,
}

export interface AuthLoginResponse {
    invalidCredentials: boolean,
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
