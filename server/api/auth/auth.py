from __future__ import annotations

from utils import App, Func, Validator as Vld
from src import Patient, Doctor, MixedUserUtil, Admin, AvailabilityDuration
from utils.request.response import Response


@App.api_route('/auth/regis/s1', 'POST', access_control='All')
@App.json_inputs('user_type', 'name', 'dob', 'whatsapp_number', 'email', 'password')
def _(user: None, user_type: str, name, dob, whatsapp_number, email, password):
    request_response = {
        'email_already_exists': False,
        'whatsapp_number_already_exists': False,
        'registration_completed': False,
        'user_type': False,
        'token': False,
    }

    user_type_validator = Vld.In('p', 'd')
    if not user_type_validator(user_type):
        return App.Res.frontend_error(Vld.format_type_error(
            'user_type', user_type, user_type_validator
        ))

    if user_type == 'p':
        user_class = Patient
    else:
        user_class = Doctor

    u = user_class()
    u.m_name = name
    u.m_dob = dob
    u.m_whatsapp_number = whatsapp_number
    u.m_email = email
    u.m_password = password

    email_exists = MixedUserUtil.email_exists(email)
    whatsapp_number_exists = MixedUserUtil.whatsapp_number_exists(whatsapp_number)

    if email_exists or whatsapp_number_exists:
        request_response['email_already_exists'] = email_exists
        request_response['whatsapp_number_already_exists'] = whatsapp_number_exists
        return App.Res.client_error(**request_response)

    if not u.insert(load_inserted_id_to=u.key.m_id):
        return App.Res.server_error('Unfortunately, registration failed. Please try again.')

    code = user_class.Register.gen_code()
    user_class.Register.send_mail(u, code)

    request_response['token'] = user_class.Register.gen_token(u, code)
    request_response['user_type'] = user_type
    request_response['registration_completed'] = True
    return App.Res.ok(**request_response)


@App.api_route(
    '/auth/regis/verify-code/<code>', 'GET',
    path_params_pre_conversion={'code': int}, path_params_validators={'code': lambda c: isinstance(c, int)},
    access_control=[Patient.Register, Doctor.Register]
)
def _(user: Patient | Doctor, code: int):
    request_response = {
        'invalid_code': False,
    }

    if getattr(user, 'code') != code:
        request_response['invalid_code'] = True
    return App.Res.ok(**request_response)


@App.api_route('/auth/regis/s2', 'POST', access_control=[Patient.Register, Doctor.Register])
@App.json_inputs('code')
def _(user: Patient | Doctor, code: int):
    request_response = {
        'invalid_code': False,
        'whatsapp_number_already_exists': False,
        'email_already_exists': False,
        'registration_completed': False,
        'token': False,
        'user_type': False,
    }

    whatsapp_number_exists = MixedUserUtil.whatsapp_number_exists(user.m_whatsapp_number)
    email_exists = MixedUserUtil.email_exists(user.m_email)

    if whatsapp_number_exists or email_exists:
        request_response['whatsapp_number_already_exists'] = whatsapp_number_exists
        request_response['email_already_exists'] = email_exists
        return App.Res.client_error(**request_response)

    if getattr(user, 'code') != code:
        request_response['invalid_code'] = True
        return App.Res.client_error(**request_response)

    # change properties so that the user can be inserted
    user.m_name = user.m_name
    user.m_dob = user.m_dob
    user.m_whatsapp_number = user.m_whatsapp_number
    user.m_email = user.m_email
    user.m_password = user.m_password
    user.m_registration_time = Func.get_current_time()

    user.insert(load_inserted_id_to=user.key.m_id)
    user.commit()
    user_type = 'p' if isinstance(user, Patient) else 'd'

    if user_type == 'd':
        for day in range(7):
            a = AvailabilityDuration()
            a.m_doctor_id = user.m_id
            a.m_from = (day * 1440) + 480
            a.m_to = (day * 1440) + 1020
            a.insert()
            a.commit()

    request_response['token'] = type(user).Login.gen_token(user)
    request_response['user_type'] = user_type
    request_response['registration_completed'] = True
    return App.Res.ok(**request_response)


@App.api_route('/auth/login', 'POST', access_control='All')
@App.json_inputs('email', 'password')
def _(user: None, email: str, password: str):
    request_response = {
        'invalid_credentials': False,
        'account_suspended': False,
        'login_successful': False,
        'token': False,
        'user_type': False,
    }

    for user_class in [Patient, Doctor, Admin]:
        u = user_class()
        u.turn_off_validation()
        u.m_email = email
        u.m_password = password
        if not u.exists():
            continue
        u.load()
        if isinstance(u, Patient) or isinstance(u, Doctor):
            if u.m_status == u.AccountStatusEnum.ACCOUNT_SUSPENDED:
                request_response['account_suspended'] = True
                return App.Res.ok(**request_response)
        request_response['token'] = user_class.Login.gen_token(u)
        request_response['user_type'] = user_class.__name__.lower()[0]
        request_response['login_successful'] = True
        return App.Res.ok(**request_response)

    request_response['invalid_credentials'] = True
    return App.Res.client_error(**request_response)


@App.api_route('/auth/verify-logins', 'GET', access_control='All')
def _(user: None):
    request_response = {
        'invalid_login': False,
        'user_type': 'g',
        'account_suspended': False,
    }

    for user_class in [Patient, Doctor, Admin]:
        try:
            token = user_class.Login.fetch_token()
            if not token:
                continue
            payload = user_class.Login.parse_token(token)
            if not payload:
                continue
            u = user_class.Login.get_user(payload)
            if u is None:
                continue
        except Response as e:
            data, status = e.generate_response()
            data = data['data']
            if data['account_suspended']:
                request_response['account_suspended'] = True
                return App.Res.ok(**request_response)
        except:
            continue
        request_response['user_type'] = user_class.__name__.lower()[0]
        break
    else:
        request_response['invalid_login'] = True

    return App.Res.ok(**request_response)


@App.api_route('/auth/get-temp-token', method='GET', access_control=[Doctor.Login, Patient.Login])
def _(user: Doctor | Patient) -> None:
    request_response = {'token_not_generated': False, 'token': user.TempUrlLogin.gen_token(user)}
    return App.Res.ok(**request_response)
