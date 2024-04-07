from __future__ import annotations

from utils import App, Func, UploadedFiles, SavedFile
from src import Doctor, Patient, Appointment, AppointmentCallProofVideo, Calc, SystemDetails


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
            d_json = d.select(select_cols=['m_name', 'm_dob'])
            if d_json:
                all_appointments.append({
                    **i,
                    'doctor': {
                        'm_id': i['m_doctor_id'],
                        'm_name': d_json[0]['m_name'],
                        'm_dob': d_json[0]['m_dob'],
                    },
                })

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
                all_appointments.append({
                    **i,
                    'patient': {
                        'm_id': i['m_patient_id'],
                        'm_name': p_json[0]['m_name'],
                        'm_dob': p_json[0]['m_dob'],
                        'm_whatsapp_number': p_json[0]['m_whatsapp_number'],
                    },
                })

    request_response['appointments'] = all_appointments
    return App.Res.ok(**request_response)


@App.api_route('/appointments/mark-as-completed', method='PUT', access_control=[Doctor.Login])
@App.json_inputs(
    'appointment_id', 'doctor_report', 'secret_code'
)
def _(user: Doctor, appointment_id, doctor_report, secret_code):
    request_response = {
        'appointment_not_exists': False,
        'invalid_secret_code': False,
        'not_completable': False,
        'marked_as_completed': False,
        'already_completed': False,
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
        'not_delayable': False,
        'already_delayed': False,
        'max_delay_reached': False,
        'delayed': False,
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

    a.m_delay_count_by_doc += 1
    a.m_status = 'DOC_REQUESTED_DELAY'
    a.m_status_change_time = Func.get_current_time()

    system = SystemDetails()
    system.m_balance = Calc.appointment_system_fee(a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY, doc_delayed=True)

    user.m_wallet_amount = Calc.appointment_doctor_cutoffs(a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY,
                                                           doc_delayed=True)

    p.m_refundable_amount = Calc.appointment_patient_refunds(a.m_paid_amount, a.StatusEnum.DOC_REQUESTED_DELAY,
                                                         doc_delayed=True)

    a.update()
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
        'appointment_not_exists': False,
        'status_not_changeable': False,
        'marked_as_doctor_not_joined': False,
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

    a.update()
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
        'appointment_not_exists': False,
        'status_not_changeable': False,
        'attempt_1_video_not_uploaded': False,
        'attempt_2_video_not_uploaded': False,
        'attempt_1_video_not_video': False,
        'attempt_2_video_not_video': False,
        'attempt_1_video_size_exceeded': False,
        'attempt_2_video_size_exceeded': False,
        'request_already_approved': False,
        'request_already_rejected': False,
        'request_already_submitted': False,
        'request_submitted': False,
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

    old_videos = AppointmentCallProofVideo()
    old_videos.m_appointment_id = appointment_id
    old_videos_json = old_videos.select(select_cols=['m_filename'])
    for i in old_videos_json:
        SavedFile(i['m_filename']).delete()
    old_videos.delete(_limit=-1)
    old_videos.commit()

    video_1 = AppointmentCallProofVideo()
    video_2 = AppointmentCallProofVideo()

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
        'appointment_not_exists': False,
        'not_cancelable': False,
        'already_cancelled_by_pat': False,
        'already_cancelled_by_doc': False,
        'cancel_operation_done': False,
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
    p.load(select_cols=['m_refundable_amount'])

    d = Doctor()
    d.m_id = a.m_doctor_id
    d.load(select_cols=['m_wallet_amount'])

    s.m_balance = Calc.appointment_system_fee(a.m_paid_amount, new_status)
    p.m_refundable_amount = Calc.appointment_patient_refunds(a.m_paid_amount, new_status)
    d.m_wallet_amount = (Calc.appointment_doctor_cutoffs(a.m_paid_amount, new_status) +
                         Calc.appointment_doctor_fee(a.m_paid_amount, new_status))

    a.update()
    s.update(set_increment_cols=['m_balance'])
    p.update(set_increment_cols=['m_refundable_amount'])
    d.update(set_increment_cols=['m_wallet_amount'])

    a.commit()
    s.commit()
    p.commit()
    d.commit()

    request_response['cancel_operation_done'] = True
    return App.Res.ok(**request_response)
