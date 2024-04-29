from __future__ import annotations

from utils import App, Func, UploadedFiles, SavedFile, Env, Validator as Vld, Secret
from src import (
    Doctor, Patient, Appointment, Calc, SystemDetails,
    Payfast, Admin,
)


@App.api_route('/appointments', method='POST', access_control=[Doctor.Login, Patient.Login])
@App.optional_json_inputs(
    id=None, status=None,
)
def _(user: Doctor | Patient, id: list[int], status: list[Appointment.StatusEnum]):
    request_response = {
        'appointments': [],
    }

    a = Appointment()

    all_appointments = []

    where_in = []
    if id:
        a.turn_off_validation_once()
        a.m_id = id
        where_in.append('m_id')
    if status:
        a.turn_off_validation_once()
        a.m_status = status
        where_in.append('m_status')

    if isinstance(user, Patient):
        a.m_patient_id = user.m_id
        a_json = a.select(
            select_cols='All',
            where_in=where_in
        )

        for i in a_json:
            d = Doctor()
            d.m_id = i['m_doctor_id']
            d_json = d.select(
                select_cols=[
                    'm_name', 'm_dob', 'm_profile_pic_filename', 'm_specialization', 'm_specialization_category_id',
                    'm_status'
                ]
            )
            if d_json:
                all_appointments.append(
                    {
                        **i,
                        'doctor': {
                            'm_id': i['m_doctor_id'],
                            **d_json[0],
                        },
                    }
                )

    else:
        a.m_doctor_id = user.m_id
        a_json = a.select(
            select_cols='All',
            where_in=where_in,
            not_select_cols=['m_secret_code'],
        )
        for i in a_json:
            d = Patient()
            d.m_id = i['m_patient_id']
            p_json = d.select(select_cols=['m_name', 'm_dob', 'm_whatsapp_number'])
            if p_json:
                all_appointments.append(
                    {
                        **i,
                        'patient': {
                            'm_id': i['m_patient_id'],
                            **p_json[0],
                        },
                    }
                )

    request_response['appointments'] = all_appointments
    return App.Res.ok(**request_response)


@App.api_route('/appointments/mark-as-completed', method='PUT', access_control=[Doctor.Login])
@App.json_inputs(
    'appointment_id', 'doctor_report', 'secret_code'
)
def _(user: Doctor, appointment_id, doctor_report, secret_code):
    request_response = {
        'appointment_not_exists': False,
        'invalid_secret_code':    False,
        'not_completable':        False,
        'marked_as_completed':    False,
        'already_completed':      False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_doctor_id = user.m_id
    if not a.load(select_cols=['m_secret_code', 'm_status', 'm_paid_amount']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING:
        request_response['not_completable'] = True
        if a.m_status == a.StatusEnum.COMPLETED:
            request_response['already_completed'] = True
        return App.Res.client_error(**request_response)

    a.m_doctor_report = doctor_report

    if a.m_secret_code != secret_code:
        request_response['invalid_secret_code'] = True
        return App.Res.client_error(**request_response)

    a.m_status = 'COMPLETED'
    a.m_status_change_time = Func.get_current_time()

    system = SystemDetails()

    system.m_balance = Calc.appointment_system_fee(a.m_paid_amount, a.StatusEnum.COMPLETED)
    user.m_wallet_amount = Calc.appointment_doctor_fee(a.m_paid_amount, a.StatusEnum.COMPLETED)

    a.update()
    system.update(set_increment_cols=['m_balance'])
    user.update(set_increment_cols=['m_wallet_amount'])

    a.commit()
    user.commit()
    system.commit()

    request_response['marked_as_completed'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointments/delay', method='PUT', access_control=[Doctor.Login])
@App.json_inputs(
    'appointment_id'
)
def _(user: Doctor, appointment_id):
    request_response = {
        'appointment_not_exists': False,
        'not_delayable':          False,
        'already_delayed':        False,
        'max_delay_reached':      False,
        'delayed':                False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_doctor_id = user.m_id
    if not a.load(select_cols=['m_status', 'm_delay_count_by_doc', 'm_patient_id', 'm_paid_amount']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING:
        request_response['not_delayable'] = True
        if a.m_status == a.StatusEnum.DOC_REQUESTED_DELAY:
            request_response['already_delayed'] = True
        return App.Res.client_error(**request_response)

    if a.m_delay_count_by_doc >= 2:
        request_response['max_delay_reached'] = True
        return App.Res.client_error(**request_response)

    p = Patient()
    p.m_id = a.m_patient_id
    p.load(select_cols=['m_refundable_amount'])

    a.m_delay_count_by_doc = 1
    a.m_status = 'DOC_REQUESTED_DELAY'
    a.m_status_change_time = Func.get_current_time()

    system = SystemDetails()
    system.m_balance = Calc.appointment_system_fee(a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY, doc_delayed=True)

    user.m_wallet_amount = Calc.appointment_doctor_cutoffs(
        a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY,
        doc_delayed=True
    )

    p.m_refundable_amount = Calc.appointment_patient_refunds(
        a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY,
        doc_delayed=True
    )

    a.m_refunded_amount = p.m_refundable_amount

    a.update(set_increment_cols=['m_refunded_amount', 'm_delay_count_by_doc'])
    system.update(set_increment_cols=['m_balance'])
    user.update(set_increment_cols=['m_wallet_amount'])
    p.update(set_increment_cols=['m_refundable_amount'])

    a.commit()
    system.commit()
    user.commit()
    p.commit()

    request_response['delayed'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointments/doctor-not-joined', method='PUT', access_control=[Doctor.Login])
@App.json_inputs(
    'appointment_id'
)
def _(user: Doctor, appointment_id):
    request_response = {
        'appointment_not_exists':              False,
        'status_not_changeable':               False,
        'marked_as_doctor_not_joined':         False,
        'already_marked_as_doctor_not_joined': False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_doctor_id = user.m_id
    if not a.load(select_cols=['m_status']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING:
        request_response['status_not_changeable'] = True
        if a.m_status == a.StatusEnum.DOC_NOT_JOINED:
            request_response['already_marked_as_doctor_not_joined'] = True
        return App.Res.client_error(**request_response)

    s = SystemDetails()

    p = Patient()
    p.m_id = a.m_patient_id
    p.load(select_cols=['m_refundable_amount'])

    a.m_status = a.StatusEnum.DOC_NOT_JOINED
    a.m_status_change_time = Func.get_current_time()

    s.m_balance = Calc.appointment_system_fee(a.m_paid_amount, a.StatusEnum.DOC_NOT_JOINED)
    p.m_refundable_amount = Calc.appointment_patient_refunds(a.m_paid_amount, a.StatusEnum.DOC_NOT_JOINED)
    user.m_wallet_amount = Calc.appointment_doctor_cutoffs(a.m_paid_amount, a.StatusEnum.DOC_NOT_JOINED)
    a.m_refunded_amount = p.m_refundable_amount

    a.update(set_increment_cols=['m_refunded_amount'])
    s.update(set_increment_cols=['m_balance'])
    p.update(set_increment_cols=['m_refundable_amount'])
    user.update(set_increment_cols=['m_wallet_amount'])

    a.commit()
    s.commit()
    p.commit()
    user.commit()

    request_response['marked_as_doctor_not_joined'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointments/patient-not-joined', method='POST', access_control=[Doctor.Login])
@App.form_inputs(
    'appointment_id'
)
@App.file_inputs(
    'attempt_1_video', 'attempt_2_video'
)
def _(user: Doctor, appointment_id, attempt_1_video: UploadedFiles, attempt_2_video: UploadedFiles):
    request_response = {
        'appointment_not_exists':        False,
        'status_not_changeable':         False,
        'attempt_1_video_not_uploaded':  False,
        'attempt_2_video_not_uploaded':  False,
        'attempt_1_video_not_video':     False,
        'attempt_2_video_not_video':     False,
        'attempt_1_video_size_exceeded': False,
        'attempt_2_video_size_exceeded': False,
        'request_already_approved':      False,
        'request_already_rejected':      False,
        'request_already_submitted':     False,
        'request_submitted':             False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_doctor_id = user.m_id
    if not a.load(select_cols=['m_status']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING:
        request_response['status_not_changeable'] = True
        if a.m_status == a.StatusEnum.PAT_NOT_JOINED_REQ:
            request_response['request_already_submitted'] = True
        elif a.m_status == a.StatusEnum.PAT_NOT_JOINED_REJ:
            request_response['request_already_rejected'] = True
        elif a.m_status == a.StatusEnum.PAT_NOT_JOINED:
            request_response['request_already_approved'] = True
        return App.Res.client_error(**request_response)

    if not attempt_1_video or not attempt_2_video or len(attempt_1_video) == 0 or len(attempt_2_video) == 0:
        if not attempt_1_video:
            request_response['attempt_1_video_not_uploaded'] = True
        if not attempt_2_video:
            request_response['attempt_2_video_not_uploaded'] = True
        return App.Res.client_error(**request_response)

    if not attempt_1_video[0].is_video() or not attempt_2_video[0].is_video():
        if not attempt_1_video[0].is_video():
            request_response['attempt_1_video_not_video'] = True
        if not attempt_2_video[0].is_video():
            request_response['attempt_2_video_not_video'] = True
        return App.Res.client_error(**request_response)

    if attempt_1_video[0].filesize > 10 or attempt_2_video[0].filesize > 10:
        if attempt_1_video[0].filesize > 10:
            request_response['attempt_1_video_size_exceeded'] = True
        if attempt_2_video[0].filesize > 10:
            request_response['attempt_2_video_size_exceeded'] = True
        return App.Res.client_error(**request_response)

    attempt_1_video[0].save()
    attempt_2_video[0].save()

    old_videos = Appointment.CallProofVideo()
    old_videos.m_appointment_id = appointment_id
    old_videos_json = old_videos.select(select_cols=['m_filename'])
    for i in old_videos_json:
        SavedFile(i['m_filename']).delete()
    old_videos.delete(_limit=-1)
    old_videos.commit()

    video_1 = Appointment.CallProofVideo()
    video_2 = Appointment.CallProofVideo()

    video_1.m_appointment_id = appointment_id
    video_2.m_appointment_id = appointment_id

    video_1.m_filename = attempt_1_video[0].uu_filename
    video_2.m_filename = attempt_2_video[0].uu_filename

    video_1.insert()
    video_2.insert()
    video_1.commit()
    video_2.commit()

    a.m_status = 'PAT_NOT_JOINED_REQ'
    a.m_status_change_time = Func.get_current_time()

    a.update()
    a.commit()

    request_response['request_submitted'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointments/cancel', method='PUT', access_control=[Doctor.Login, Patient.Login])
@App.json_inputs(
    'appointment_id'
)
def _(user: Doctor | Patient, appointment_id):
    request_response = {
        'appointment_not_exists':   False,
        'not_cancelable':           False,
        'already_cancelled_by_pat': False,
        'already_cancelled_by_doc': False,
        'cancel_operation_done':    False,
    }

    a = Appointment()
    a.m_id = appointment_id
    if isinstance(user, Patient):
        a.m_patient_id = user.m_id
    else:
        a.m_doctor_id = user.m_id

    if not a.load(select_cols=['m_status', 'm_patient_id', 'm_paid_amount', 'm_doctor_id']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING:
        request_response['not_cancelable'] = True
        if a.m_status == a.StatusEnum.PAT_CANCELLED:
            request_response['already_cancelled_by_pat'] = True
        if a.m_status == a.StatusEnum.DOC_CANCELLED:
            request_response['already_cancelled_by_doc'] = True
        return App.Res.client_error(**request_response)

    new_status = a.StatusEnum.PAT_CANCELLED if isinstance(user, Patient) else a.StatusEnum.DOC_CANCELLED
    a.m_status = new_status
    a.m_status_change_time = Func.get_current_time()

    s = SystemDetails()
    p = Patient()
    p.m_id = a.m_patient_id

    d = Doctor()
    d.m_id = a.m_doctor_id

    s.m_balance = Calc.appointment_system_fee(a.m_paid_amount, new_status)
    p.m_refundable_amount = Calc.appointment_patient_refunds(a.m_paid_amount, new_status)
    d.m_wallet_amount = (Calc.appointment_doctor_cutoffs(a.m_paid_amount, new_status) +
                         Calc.appointment_doctor_fee(a.m_paid_amount, new_status))
    a.m_refunded_amount = p.m_refundable_amount

    a.update(set_increment_cols=['m_refunded_amount'])
    s.update(set_increment_cols=['m_balance'])
    p.update(set_increment_cols=['m_refundable_amount'])
    d.update(set_increment_cols=['m_wallet_amount'])

    a.commit()
    s.commit()
    p.commit()
    d.commit()

    request_response['cancel_operation_done'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointment/book', method='POST', access_control=[Patient.Login])
@App.json_inputs(
    'doctor_id', 'time_from', 'time_to', 'symptom_description'
)
def _(user: Patient, doctor_id: int, time_from: str, time_to: str, symptom_description: str):
    request_response = {
        'doctor_not_exists':  False,
        'doctor_not_active':  False,
        'invalid_slot':       False,
        'slot_clash':         False,
        'appointment_booked': False,
        'appointment_token':  False,
    }

    d = Doctor()
    d.m_id = doctor_id
    if not d.load(
            select_cols=['m_status', 'm_active_for_appointments', 'm_max_meeting_duration',
                'm_appointment_charges']
    ):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if d.m_status != d.AccountStatusEnum.ACCOUNT_APPROVED or not d.m_active_for_appointments:
        request_response['doctor_not_active'] = True
        return App.Res.client_error(**request_response)

    a = Appointment()
    a.m_time_from = time_from
    a.m_time_to = time_to

    if not d.is_valid_slot(a.m_time_from, a.m_time_to):
        request_response['invalid_slot'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(a.m_time_from, a.m_time_to):
        request_response['slot_clash'] = True
        return App.Res.client_error(**request_response)

    ar = Appointment.Request()
    ar.m_patient_id = user.m_id
    ar.delete(_limit=-1)
    ar.commit()
    ar.reset()

    ar.m_patient_id = user.m_id
    ar.m_doctor_id = doctor_id
    ar.m_time_from = time_from
    ar.m_time_to = time_to
    ar.m_symptom_description = symptom_description
    ar.m_payable_amount = d.m_appointment_charges

    ar.insert(load_inserted_id_to='m_id')
    ar.commit()

    request_response['appointment_booked'] = True
    request_response['appointment_token'] = Appointment.BookClientLogin.gen_token(ar)
    return App.Res.ok(**request_response)


@App.api_route('/appointment/book/verify-auth', method='GET', access_control=[Patient.Login])
def _(user: Patient):
    request_response = {
        'invalid_token':              False,
        'doctor_not_exists':          False,
        'doctor_not_active':          False,
        'invalid_slot':               False,
        'slot_clash':                 False,
        'appointment_already_booked': False,
        'verified':                   False,
    }

    token = Appointment.BookClientLogin.fetch_token()
    if not token:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    payload = Appointment.BookClientLogin.parse_token(token)
    if not payload:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    ar = Appointment.BookClientLogin.get_user(payload)

    if not ar:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    if not ar.load():
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = ar.m_doctor_id
    if not d.load(select_cols=['m_status', 'm_active_for_appointments', 'm_max_meeting_duration']):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if d.m_status != d.AccountStatusEnum.ACCOUNT_APPROVED or not d.m_active_for_appointments:
        request_response['doctor_not_active'] = True
        return App.Res.client_error(**request_response)

    if not d.is_valid_slot(ar.m_time_from, ar.m_time_to):
        request_response['invalid_slot'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(ar.m_time_from, ar.m_time_to):
        request_response['slot_clash'] = True
        return App.Res.client_error(**request_response)

    request_response['verified'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointment/book/payfast-params', method='GET', access_control=[Patient.Login])
def _(user: Patient):
    request_response = {
        'invalid_token':              False,
        'doctor_not_exists':          False,
        'doctor_not_active':          False,
        'invalid_slot':               False,
        'slot_clash':                 False,
        'appointment_already_booked': False,
        'verified':                   False,
        'params_generated':           False,
        'payfast_params':             False,
    }

    token = Appointment.BookClientLogin.fetch_token()
    if not token:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    payload = Appointment.BookClientLogin.parse_token(token)
    if not payload:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    ar = Appointment.BookClientLogin.get_user(payload)

    if not ar:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    if not ar.load():
        a = Appointment()
        a.m_time_from = ar.m_time_from
        a.m_time_to = ar.m_time_to
        a.m_doctor_id = ar.m_doctor_id
        a.m_patient_id = ar.m_patient_id
        if a.exists():
            request_response['appointment_already_booked'] = True
        else:
            request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = ar.m_doctor_id
    if not d.load(select_cols=['m_status', 'm_active_for_appointments', 'm_max_meeting_duration', 'm_name']):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if d.m_status != d.AccountStatusEnum.ACCOUNT_APPROVED or not d.m_active_for_appointments:
        request_response['doctor_not_active'] = True
        return App.Res.client_error(**request_response)

    if not d.is_valid_slot(ar.m_time_from, ar.m_time_to):
        request_response['invalid_slot'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(ar.m_time_from, ar.m_time_to):
        request_response['slot_clash'] = True
        return App.Res.client_error(**request_response)

    request_response['verified'] = True

    payfast_login_auth_token = Appointment.BookPayfastLogin.gen_token(ar)

    payfast = Payfast()
    payfast.m_id = ar.m_id
    payfast.m_amount = ar.m_payable_amount

    payfast_token, token_gen_time = payfast.get_form_token()

    if (not payfast_token) or (not token_gen_time):
        request_response['params_generated'] = False
        return App.Res.client_error(**request_response)

    payfast_param = {
        'token':                  payfast_token,
        'currency_code':          'PKR',
        'merchant_id':            Env.get('PAYFAST_MERCHANT_ID'),
        'merchant_name':          'UAT Demo Merchant',
        'basket_id':              payfast.m_id,
        'txnamt':                 payfast.m_amount,
        'order_date':             Func.get_defined_datetime_str(token_gen_time)[:10],
        'checkout_url':           f'http://{Env.get("SERVER_IP_WITH_PORT")}/api/appointment/book/payfast-notification'
        # f'?t={Func.encode_url_param_val(payfast_login_auth_token)}'
        ,
        'form_url':               payfast.CurrentDetails.redirection_api,
        'txndesc':                'A description goes here',
        'proc_code':              '00',
        'tran_type':              'ECOMM_PURCHASE',
        'customer_mobile_no':     user.m_whatsapp_number,
        'customer_email_address': user.m_email,
        'signature':              '1234567890',
        'version':                '1.0.0',
        'customer_name':          user.m_name,
        'items':                  [{'sku': 'Appointment', 'name': d.m_name, 'price': payfast.m_amount, 'qty': 1}],
    }

    request_response['payfast_params'] = payfast_param
    request_response['params_generated'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointment/book/payfast-notification', method='GET')
def _(user: None):
    return App.Res.ok()


@App.api_route(
    '/appointment/<appointment_id>/reschedule', path_params_pre_conversion={'appointment_id': int},
    method='PUT', access_control=[Patient.Login]
)
@App.json_inputs(
    'time_from', 'time_to'
)
def _(user: Patient, appointment_id: int, time_from: str, time_to: str) -> None:
    request_response = {
        'appointment_not_exists': False,
        'not_reschedulable':      False,
        'doctor_not_exists':      False,
        'doctor_not_active':      False,
        'max_reschedule_reached': False,
        'invalid_slot':           False,
        'slot_clash':             False,
        'rescheduled':            False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_patient_id = user.m_id
    if not a.load(select_cols=['m_status', 'm_doctor_id', 'm_reschedule_count_by_pat']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PENDING and a.m_status != a.StatusEnum.DOC_REQUESTED_DELAY and \
            a.m_status != a.StatusEnum.SLOT_CLASH:
        request_response['not_reschedulable'] = True
        return App.Res.client_error(**request_response)

    if a.m_status == a.StatusEnum.PENDING and a.m_reschedule_count_by_pat >= 2:
        request_response['max_reschedule_reached'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = a.m_doctor_id
    if not d.load(select_cols=['m_max_meeting_duration', 'm_active_for_appointments']):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if not d.m_active_for_appointments:
        request_response['doctor_not_active'] = True
        return App.Res.client_error(**request_response)

    _a = Appointment()  # for validation
    _a.m_time_from = time_from
    _a.m_time_to = time_to

    if not d.is_valid_slot(_a.m_time_from, _a.m_time_to):
        request_response['invalid_slot'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(_a.m_time_from, _a.m_time_to):
        request_response['slot_clash'] = True
        return App.Res.client_error(**request_response)

    appoint_prev_status = a.m_status
    a.m_time_from = time_from
    a.m_time_to = time_to
    a.m_status = a.StatusEnum.PENDING
    a.m_reschedule_count_by_pat = 0
    a.m_status_change_time = Func.get_current_time()

    if appoint_prev_status == a.StatusEnum.PENDING:
        a.m_reschedule_count_by_pat = 1

    a.update(set_increment_cols=['m_reschedule_count_by_pat'])
    a.commit()

    request_response['rescheduled'] = True
    return App.Res.ok(**request_response)


@App.api_route(
    '/appointment/<appointment_id>/review',
    path_params_pre_conversion={'appointment_id': int},
    method='PUT', access_control=[Patient.Login]
)
@App.json_inputs(
    'rating', 'review'
)
def _(user: Patient, appointment_id: int, rating: int, review: str) -> None:
    request_response = {
        'appointment_not_exists': False,
        'already_reviewed':       False,
        'cannot_review':          False,
        'reviewed_successfully':  False,
    }

    a = Appointment()
    a.m_id = appointment_id
    a.m_patient_id = user.m_id
    if not a.load(select_cols=['m_status', 'm_doctor_id', 'm_patient_review']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.COMPLETED:
        request_response['cannot_review'] = True
        return App.Res.client_error(**request_response)

    if a.m_patient_review:
        request_response['already_reviewed'] = True
        return App.Res.client_error(**request_response)

    a.m_patient_review = review
    a.m_rating = rating

    a.update()
    a.commit()

    request_response['reviewed_successfully'] = True
    return App.Res.ok(**request_response)


@App.api_route('/appointments/transactions', method='GET', access_control=[Patient.Login, Doctor.Login])
def _(user: Patient | Doctor) -> None:
    request_response = {
        'transactions': [],
    }

    a = Appointment()
    if isinstance(user, Doctor):
        a.m_doctor_id = user.m_id
        a.m_status = a.StatusEnum.COMPLETED
        select_cols = [
            'm_id', 'm_patient_id', 'm_time_from', 'm_time_to', 'm_payment_time', 'm_status', 'm_paid_amount',
            'm_refunded_amount'
        ]
        participant = Patient()
        participant_col = 'm_patient_id'
        participant_title = 'patient'
    else:
        a.m_patient_id = user.m_id
        select_cols = [
            'm_id', 'm_doctor_id', 'm_time_from', 'm_time_to', 'm_payment_time', 'm_status', 'm_paid_amount',
            'm_refunded_amount'
        ]
        participant = Doctor()
        participant_col = 'm_doctor_id'
        participant_title = 'doctor'

    a_json = a.select(
        select_cols=select_cols, _order_by='m_time_from', _desc=True
    )

    for i in a_json:
        participant.reset()
        participant.m_id = i[participant_col]
        d_json = participant.select(select_cols=['m_name'], _limit=1)
        if d_json:
            request_response['transactions'].append(
                {
                    **i,
                    participant_title: {
                        'm_id': i[participant_col],
                        **d_json[0],
                    },
                }
            )
        else:
            request_response['transactions'].append(i)

    return App.Res.ok(**request_response)


@App.api_route('/a/appointments', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_appointments(user)


@App.api_route(
    '/a/appointment/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_appointments(user, id)


def get_appointments(user: Admin, id: int = None):
    request_response = {
        'appointments': []
    }
    a = Appointment()
    if id:
        a.m_id = id
    request_response['appointments'] = a.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route(
    '/a/appointment/<id>/patient-not-joined/reject',
    path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()},
    method='PUT',
    access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    request_response = {
        'appointment_not_exists':                      False,
        'status_not_changeable':                       False,
        'already_marked_as_patient_not_joined_reject': False,
        'marked_as_patient_not_joined_reject':         False,
    }

    a = Appointment()
    a.turn_off_validation()
    a.m_id = id
    if not a.load(select_cols=['m_status']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PAT_NOT_JOINED_REQ:
        request_response['status_not_changeable'] = True
        if a.m_status == a.StatusEnum.PAT_NOT_JOINED_REJ:
            request_response['already_marked_as_patient_not_joined_reject'] = True
        return App.Res.client_error(**request_response)

    a.m_status = a.StatusEnum.PAT_NOT_JOINED_REJ
    a.m_status_change_time = Func.get_current_time()

    a.update()
    a.commit()

    request_response['marked_as_patient_not_joined_reject'] = True
    return App.Res.ok(**request_response)


@App.api_route(
    '/a/appointment/<id>/patient-not-joined/approve',
    path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()},
    method='PUT',
    access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    request_response = {
        'appointment_not_exists':               False,
        'status_not_changeable':                False,
        'already_marked_as_patient_not_joined': False,
        'marked_as_patient_not_joined':         False,
    }

    a = Appointment()
    a.turn_off_validation()
    a.m_id = id
    if not a.load(select_cols=['m_status']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PAT_NOT_JOINED_REQ:
        request_response['status_not_changeable'] = True
        if a.m_status == a.StatusEnum.PAT_NOT_JOINED:
            request_response['already_marked_as_patient_not_joined'] = True
        return App.Res.client_error(**request_response)

    a.m_status = a.StatusEnum.PAT_NOT_JOINED
    a.m_status_change_time = Func.get_current_time()

    a.update()
    a.commit()

    request_response['marked_as_patient_not_joined'] = True
    return App.Res.ok(**request_response)


@App.api_route(
    '/a/appointment/<id>/patient-not-joined/attempt-videos', path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    request_response = {
        'appointment_not_exists': False,
        'status_not_suitable':    False,
        'videos':                 [],
    }

    a = Appointment()
    a.turn_off_validation()
    a.m_id = id
    if not a.load(select_cols=['m_status']):
        request_response['appointment_not_exists'] = True
        return App.Res.client_error(**request_response)

    if a.m_status != a.StatusEnum.PAT_NOT_JOINED_REQ:
        request_response['status_not_suitable'] = True
        return App.Res.client_error(**request_response)

    cv = Appointment.CallProofVideo()
    cv.m_appointment_id = id
    videos = cv.select(select_cols=['m_filename'])

    request_response['videos'] = [i['m_filename'] for i in videos]
    return App.Res.ok(**request_response)


@App.api_route(
    '/appointment/book-via-stripe/create-payment-intent/v1',
    method='POST', access_control=[Patient.Login]
)
def _(user: Patient):
    request_response = {
        'appointment_not_exists':     False,
        'invalid_token':              False,
        'appointment_already_booked': False,
        'doctor_not_exists':          False,
        'payment_intent_created':     False,
        'client_secret':              False,
    }

    token = Appointment.BookClientLogin.fetch_token()
    if not token:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    payload = Appointment.BookClientLogin.parse_token(token)
    if not payload:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    ar = Appointment.BookClientLogin.get_user(payload)

    if not ar:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    if not ar.load():
        a = Appointment()
        a.m_time_from = ar.m_time_from
        a.m_time_to = ar.m_time_to
        a.m_doctor_id = ar.m_doctor_id
        a.m_patient_id = ar.m_patient_id
        if a.exists():
            request_response['appointment_already_booked'] = True
        else:
            request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = ar.m_doctor_id
    if not d.load(select_cols=['m_status', 'm_active_for_appointments', 'm_max_meeting_duration', 'm_name']):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    amount = int(ar.m_payable_amount) * 100
    currency = 'PKR'
    patient_name = user.m_name
    doctor_name = d.m_name
    specialization = d.m_specialization
    platform_title = App.platform_name
    platform_slogan = 'Health1st'

    import stripe
    stripe.api_key = Env.get('STRIPE_SECRET_KEY')
    payment_intent = stripe.PaymentIntent.create(
        amount=amount,
        currency=currency,
        description=f"Appointment booking for {patient_name} with Dr. {doctor_name} ({specialization})",
        metadata={
            'platform_title':  platform_title,
            'platform_slogan': platform_slogan
        }
    )

    request_response['payment_intent_created'] = True
    request_response['client_secret'] = payment_intent.client_secret
    return App.Res.ok(**request_response)


@App.api_route(
    '/appointment/book-via-stripe/create-payment-link/v1',
    method='POST', access_control=[Patient.Login]
)
@App.json_inputs(
    'success_url', 'failure_url'
)
def _(user: Patient, success_url: str, failure_url: str):
    request_response = {
        'appointment_not_exists':     False,
        'doctor_not_exists':          False,
        'doctor_not_active':          False,
        'invalid_slot':               False,
        'slot_clash':                 False,
        'appointment_already_booked': False,
        'verified':                   False,
        'invalid_token':              False,
        'payment_link_created':       False,
        'payment_link':               False,
    }

    token = Appointment.BookClientLogin.fetch_token()
    if not token:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    payload = Appointment.BookClientLogin.parse_token(token)
    if not payload:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    ar = Appointment.BookClientLogin.get_user(payload)

    if not ar:
        request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    if not ar.load():
        a = Appointment()
        a.m_time_from = ar.m_time_from
        a.m_time_to = ar.m_time_to
        a.m_doctor_id = ar.m_doctor_id
        a.m_patient_id = ar.m_patient_id
        if a.exists():
            request_response['appointment_already_booked'] = True
        else:
            request_response['invalid_token'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = ar.m_doctor_id
    if not d.load(
            select_cols=[
                'm_status', 'm_active_for_appointments', 'm_max_meeting_duration', 'm_name', 'm_profile_pic_filename'
            ]
    ):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if d.m_status != d.AccountStatusEnum.ACCOUNT_APPROVED or not d.m_active_for_appointments:
        request_response['doctor_not_active'] = True
        return App.Res.client_error(**request_response)

    if not d.is_valid_slot(ar.m_time_from, ar.m_time_to):
        request_response['invalid_slot'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(ar.m_time_from, ar.m_time_to):
        request_response['slot_clash'] = True
        return App.Res.client_error(**request_response)

    request_response['verified'] = True

    amount = int(ar.m_payable_amount) * 100
    currency = 'PKR'
    patient_name = user.m_name
    doctor_name = d.m_name
    specialization = d.m_specialization
    platform_title = App.platform_name
    platform_slogan = 'Health1st'

    import stripe
    stripe.api_key = Env.get('STRIPE_SECRET_KEY')
    payment_link = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency':     currency,
                'product_data': {
                    'name':   f'Appointment with Dr. {doctor_name}',
                    'images': [Env.get('SERVER_IP_WITH_PORT') + '/api/file/' + d.m_profile_pic_filename],
                },
                'unit_amount':  amount,
            },
            'quantity':   1,
        }],
        mode='payment',
        success_url=success_url,
        cancel_url=failure_url,
        client_reference_id=ar.m_patient_id,
        metadata={
            'patient_name':      patient_name,
            'doctor_name':       doctor_name,
            'specialization':    specialization,
            'platform_title':    platform_title,
            'platform_slogan':   platform_slogan,
            'ar_id':             ar.m_id,
            'ar_time_from':      Func.get_defined_datetime_str(ar.m_time_from),
            'ar_time_to':        Func.get_defined_datetime_str(ar.m_time_to),
            'ar_payable_amount': ar.m_payable_amount,
            'ar_doctor_id':      ar.m_doctor_id,
            'ar_patient_id':     ar.m_patient_id,
        },
    )

    request_response['payment_link_created'] = True
    request_response['payment_link'] = payment_link.url
    return App.Res.ok(**request_response)


@App.api_route('/webhook/stripe/appointment-booked', method='POST', access_control='All')
def _(user: None):
    request_response = {
        'invalid_payload':            False,
        'invalid_signature':          False,
        'appointment_already_booked': False,
        'slot_clash':                 False,
        'appointment_booked':         False,
        'booked_appointment_id':      0,
    }

    from flask import request
    import stripe

    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, Env.get('STRIPE_WEBHOOK_APPOINTMENT_BOOKED_SECRET')
            )
        except ValueError as e:
            request_response['invalid_payload'] = True
            return App.Res.client_error(**request_response)
        except stripe.error.SignatureVerificationError as e:
            request_response['invalid_signature'] = True
            return App.Res.client_error(**request_response)

        if event['type'] == 'checkout.session.completed':
            obj = event['data']['object']
            metadata = obj['metadata']
            p_id = int(obj['client_reference_id'])
            total_amount = float(obj['amount_total']) / 100
            time_from = metadata['ar_time_from']
            time_to = metadata['ar_time_to']
            doctor_id = int(metadata['ar_doctor_id'])
            patient_id = int(metadata['ar_patient_id'])
            ar_id = int(metadata['ar_id'])

        else:
            request_response['invalid_payload'] = True
            return App.Res.client_error(**request_response)
    except App.Res as e:
        raise e

    ar = Appointment.Request()
    ar.m_time_from = time_from
    ar.m_time_to = time_to
    ar.m_doctor_id = doctor_id
    ar.m_patient_id = patient_id
    if not ar.load():
        a = Appointment()
        a.m_time_from = time_from
        a.m_time_to = time_to
        a.m_doctor_id = doctor_id
        a.m_patient_id = patient_id
        if a.exists():
            request_response['appointment_already_booked'] = True
        else:
            request_response['invalid_payload'] = True
        return App.Res.client_error(**request_response)

    d = Doctor()
    d.m_id = ar.m_doctor_id
    if not d.load(select_cols=['m_max_meeting_duration']):
        request_response['doctor_not_exists'] = True
        return App.Res.client_error(**request_response)

    if d.any_slot_clash(ar.m_time_from, ar.m_time_to):
        request_response['slot_clash'] = True

    curr_time = Func.get_current_time()
    secret_code = Secret.gen_random_code_str(5, [1, 4])

    a = Appointment()
    a.m_time_from = ar.m_time_from
    a.m_time_to = ar.m_time_to
    a.m_doctor_id = ar.m_doctor_id
    a.m_patient_id = ar.m_patient_id
    a.m_status = a.StatusEnum.SLOT_CLASH if request_response['slot_clash'] else a.StatusEnum.PENDING
    a.m_payment_time = curr_time
    a.m_status_change_time = curr_time
    a.m_paid_amount = total_amount
    a.m_secret_code = secret_code
    a.m_symptom_description = ar.m_symptom_description

    a.insert(load_inserted_id_to='m_id')

    ar.delete()

    a.commit()
    ar.commit()

    request_response['appointment_booked'] = True
    request_response['booked_appointment_id'] = a.m_id

    return App.Res.ok(**request_response)
