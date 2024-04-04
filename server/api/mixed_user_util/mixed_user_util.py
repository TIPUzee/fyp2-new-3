from __future__ import annotations

from src import Patient, Doctor, MixedUserUtil, AvailabilityDuration, DoctorLanguage, DoctorExperience
from utils import App


@App.api_route('/email-exists/<email_address>', 'GET',
               path_params_pre_conversion={'email_address': str}, access_control='All')
def _(user: None, email_address: str) -> None:
    request_response = {
        'email_exists': False
    }
    if MixedUserUtil.email_exists(email_address):
        request_response['email_exists'] = True
    return App.Res.ok(**request_response)


@App.api_route('/whatsapp-number-exists/<whatsapp_number>', 'GET',
               path_params_pre_conversion={'whatsapp_number': str}, access_control='All')
def _(user: None, whatsapp_number: str) -> None:
    request_response = {
        'whatsapp_number_exists': False
    }
    if MixedUserUtil.whatsapp_number_exists(whatsapp_number):
        request_response['whatsapp_number_exists'] = True
    return App.Res.ok(**request_response)


@App.api_route('/profile', 'GET', access_control=[Patient.Login, Doctor.Login])
def _(user: Patient | Doctor) -> None:
    request_response = {
        'profile': False,
        'user_type': False
    }

    if isinstance(user, Patient):
        profile = user.to_dict(exclude_attr=[user.key.m_password])
        request_response['profile'] = profile
        request_response['user_type'] = 'p'
        return App.Res.ok(**request_response)

    elif isinstance(user, Doctor):
        profile = user.to_dict(exclude_attr=[user.key.m_password])
        a = AvailabilityDuration()
        a.turn_off_validation()
        a.m_doctor_id = user.m_id
        profile['m_availability_durations'] = a.select()

        dl = DoctorLanguage()
        dl.turn_off_validation()
        dl.m_doctor_id = user.m_id
        profile['m_languages'] = dl.select()

        de = DoctorExperience()
        de.turn_off_validation()
        de.m_doctor_id = user.m_id
        profile['m_experiences'] = de.select()

        request_response['profile'] = profile
        request_response['user_type'] = 'd'
        return App.Res.ok(**request_response)
