from utils import App, Validator as Vld
from src import Patient, MixedUserUtil, Admin


@App.api_route('/p/profile', 'PUT', access_control=[Patient.Login])
@App.json_inputs('name', 'dob', 'whatsapp_number', 'email', 'password', 'old_password')
def _(user: Patient, name, dob, whatsapp_number, email, password, old_password):
    request_response = {
        'email_exists':           False,
        'whatsapp_number_exists': False,
        'invalid_old_password':   False,
        'profile_updated':        False
    }

    if email != user.m_email:
        if MixedUserUtil.email_exists(email):
            request_response['email_exists'] = True
            return App.Res.client_error(**request_response)
        user.m_email = email

    if whatsapp_number != user.m_whatsapp_number:
        if MixedUserUtil.whatsapp_number_exists(whatsapp_number):
            request_response['whatsapp_number_exists'] = True
            return App.Res.client_error(**request_response)
        user.m_whatsapp_number = whatsapp_number

    if password or email != user.m_email or whatsapp_number != user.m_whatsapp_number:
        if user.m_password != old_password:
            request_response['invalid_old_password'] = True
            return App.Res.client_error(**request_response)

    if password:
        user.m_password = password

    user.m_name = name
    user.m_dob = dob
    user.m_whatsapp_number = whatsapp_number
    user.m_email = email
    user.update()
    user.commit()
    request_response['profile_updated'] = True
    return App.Res.ok(**request_response)


@App.api_route('/a/patients', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_patients(user)


@App.api_route(
    '/a/patient/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_patients(user, id)


def get_patients(user: Admin, id: int = None):
    request_response = {
        'patients': []
    }
    p = Patient()
    if id:
        p.m_id = id
    request_response['patients'] = p.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route('/a/patient', 'PUT', access_control=[Admin.Login])
@App.json_inputs('id', 'email', 'password', 'status')
def _(user: Admin, id, email: str, password, status):
    request_response = {
        'email_already_exists': False,
        'patient_not_found':    False,
        'patient_updated':      False
    }

    p = Patient()
    p.m_id = id
    if not p.load(select_cols=['m_email']):
        request_response['patient_not_found'] = True
        return App.Res.client_error(**request_response)

    if MixedUserUtil.email_exists(email) and email.lower() != p.m_email.lower():
        request_response['email_already_exists'] = True
        return App.Res.client_error(**request_response)

    p.m_email = email
    p.m_password = password
    p.m_status = status

    p.update()
    p.commit()

    request_response['patient_updated'] = True
    return App.Res.ok(**request_response)
