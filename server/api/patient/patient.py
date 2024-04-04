from utils import App
from src import Patient, MixedUserUtil


@App.api_route('/p/profile', 'PUT', access_control=[Patient.Login])
@App.json_inputs('name', 'dob', 'whatsapp_number', 'email', 'password', 'old_password')
def _(user: Patient, name, dob, whatsapp_number, email, password, old_password):
    request_response = {
        'email_exists': False,
        'whatsapp_number_exists': False,
        'invalid_old_password': False,
        'profile_updated': False
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
