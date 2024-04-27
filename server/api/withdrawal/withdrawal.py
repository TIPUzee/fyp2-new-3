from __future__ import annotations

from datetime import datetime, timezone

from utils import App, Validator as Vld, UploadedFiles
from src import Doctor, Patient, Admin, DoctorWithdrawalTransaction, PatientRefundTransaction


@App.api_route('/withdrawal', method='GET', access_control=[Doctor.Login, Patient.Login])
def _(user: Doctor | Patient) -> None:
    request_response = {
        'never_requested':   False,
        'already_requested': False,
        'prev_rejected':     False,
        'prev_completed':    False,
        'request_details':   False,
    }

    if isinstance(user, Doctor):
        rt = DoctorWithdrawalTransaction()
        rt.m_doctor_id = user.m_id
    else:
        rt = PatientRefundTransaction()
        rt.m_patient_id = user.m_id

    if not rt.load(_order_by='m_request_time', _desc=True):
        request_response['never_requested'] = True
        return App.Res.ok(**request_response)

    elif rt.m_status == DoctorWithdrawalTransaction.StatusType.REQUESTED:
        request_response['already_requested'] = True

    elif rt.m_status == DoctorWithdrawalTransaction.StatusType.REJECTED:
        request_response['prev_rejected'] = True

    elif rt.m_status == DoctorWithdrawalTransaction.StatusType.COMPLETED:
        request_response['prev_completed'] = True

    request_response['request_details'] = rt.to_dict()
    return App.Res.ok(**request_response)


@App.api_route('/withdrawal', method='POST', access_control=[Doctor.Login, Patient.Login])
@App.json_inputs(
    'receiver_ep_nb', 'receiver_ep_username', 'amount'
)
def _(user: Doctor | Patient, receiver_ep_nb: str, receiver_ep_username: str, amount: int) -> None:
    request_response = {
        'min_amount':                     0,
        'min_amount_not_met':             False,
        'insufficient_amount_in_account': False,
        'already_requested':              False,
        'success':                        False,
    }

    print(amount, type(amount))
    nb_validator = Vld.Int()
    if nb_validator(receiver_ep_nb):
        return App.Res.frontend_error(
            Vld.format_type_error('amount', amount, nb_validator)
        )

    if isinstance(user, Doctor):
        request_response['min_amount'] = 5000

        if user.m_wallet_amount < amount:
            request_response['insufficient_amount_in_account'] = True
            return App.Res.client_error(**request_response)

        if amount < request_response['min_amount']:
            request_response['min_amount_not_met'] = True
            return App.Res.client_error(**request_response)

        w = DoctorWithdrawalTransaction()
        w.m_doctor_id = user.m_id

    else:
        request_response['min_amount'] = 500

        if user.m_refundable_amount < amount:
            request_response['insufficient_amount_in_account'] = True
            return App.Res.client_error(**request_response)

        if amount < request_response['min_amount']:
            request_response['min_amount_not_met'] = True
            return App.Res.client_error(**request_response)

        w = PatientRefundTransaction()
        w.m_patient_id = user.m_id

    w.m_status = DoctorWithdrawalTransaction.StatusType.REQUESTED

    if w.exists():
        request_response['already_requested'] = True
        return App.Res.client_error(**request_response)

    if isinstance(user, Doctor):
        w.m_amount = float(amount)
    else:
        w.m_amount = float(int(amount))

    w.m_receiver_ep_nb = receiver_ep_nb
    w.m_receiver_ep_username = receiver_ep_username
    w.m_request_time = datetime.now(timezone.utc)

    w.insert()
    w.commit()

    request_response['success'] = True
    return App.Res.ok(**request_response)


@App.api_route('/withdrawal/all', method='GET', access_control=[Doctor.Login, Patient.Login])
def _(user: Patient | Doctor) -> None:
    request_response = {
        'no_transactions':     False,
        'refund_transactions': [],
    }

    if isinstance(user, Doctor):
        w = DoctorWithdrawalTransaction()
        w.m_doctor_id = user.m_id
    else:
        w = PatientRefundTransaction()
        w.m_patient_id = user.m_id

    w.m_status = w.StatusType.COMPLETED
    w_list = w.select()

    if not w_list:
        request_response['no_transactions'] = True

    request_response['refund_transactions'] = w_list
    return App.Res.ok(**request_response)


@App.api_route('/a/p/withdrawals', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_patient_withdrawals(user)


@App.api_route(
    '/a/p/withdrawal/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_patient_withdrawals(user, id)


def get_patient_withdrawals(user: Admin, id: int = None):
    request_response = {
        'withdrawals': []
    }
    a = PatientRefundTransaction()
    if id:
        a.m_id = id
    request_response['withdrawals'] = a.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route('/a/p/withdrawal/complete', 'PUT', access_control=[Admin.Login])
@App.form_inputs('id', 'sender_ep_nb', 'sender_ep_username', 'trx_id', 'trx_time')
@App.file_inputs('ss')
def _(
    user: Admin,
    id,
    sender_ep_nb: str,
    sender_ep_username: str,
    trx_id: str,
    trx_time: str,
    ss: UploadedFiles,
) -> None:
    request_response = {
        'withdrawal_not_found':      False,
        'already_responded':         False,
        'withdrawal_current_status': PatientRefundTransaction.StatusType.REQUESTED,
        'withdrawal_completed':      False,
    }

    a = PatientRefundTransaction()
    a.m_id = id

    if not a.load(select_cols=['m_status']):
        request_response['withdrawal_not_found'] = True

    elif a.m_status != PatientRefundTransaction.StatusType.REQUESTED:
        request_response['already_responded'] = True
        request_response['withdrawal_current_status'] = a.m_status

    else:
        _ss = [_.uu_filename for _ in ss]
        img_validator = Vld.And(Vld.ListLike(), Vld.MinLen(1), Vld.MaxLen(1))
        if not img_validator(_ss):
            return App.Res.frontend_error(
                Vld.format_type_error(
                    'ss',
                    ss,
                    img_validator
                )
            )
        a.m_sender_ep_nb = sender_ep_nb
        a.m_sender_ep_username = sender_ep_username
        a.m_trx_id = trx_id
        a.m_trx_time = trx_time
        a.m_status = PatientRefundTransaction.StatusType.COMPLETED

        ss[0].save()
        a.m_ss = ss[0].uu_filename

        a.update()
        a.commit()

        request_response['withdrawal_completed'] = True
        request_response['withdrawal_current_status'] = a.m_status

    return App.Res.ok(**request_response)


@App.api_route('/a/p/withdrawal/reject', 'PUT', access_control=[Admin.Login])
@App.json_inputs('id', 'reason')
def _(user: Admin, id, reason: str) -> None:
    request_response = {
        'withdrawal_not_found':      False,
        'already_responded':         False,
        'withdrawal_current_status': PatientRefundTransaction.StatusType.REQUESTED,
        'withdrawal_rejected':       False,
    }

    a = PatientRefundTransaction()
    a.m_id = id

    if not a.load(select_cols=['m_status']):
        request_response['withdrawal_not_found'] = True

    elif a.m_status != PatientRefundTransaction.StatusType.REQUESTED:
        request_response['already_responded'] = True
        request_response['withdrawal_current_status'] = a.m_status

    else:
        a.m_rejection_reason = reason
        a.m_status = PatientRefundTransaction.StatusType.REJECTED

        a.update()
        a.commit()

        request_response['withdrawal_rejected'] = True
        request_response['withdrawal_current_status'] = a.m_status

    return App.Res.ok(**request_response)


@App.api_route('/a/d/withdrawals', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_doctor_withdrawals(user)


@App.api_route(
    '/a/d/withdrawal/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_doctor_withdrawals(user, id)


def get_doctor_withdrawals(user: Admin, id: int = None):
    request_response = {
        'withdrawals': []
    }
    a = DoctorWithdrawalTransaction()
    if id:
        a.m_id = id
    request_response['withdrawals'] = a.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route('/a/d/withdrawal/complete', 'PUT', access_control=[Admin.Login])
@App.json_inputs('id', 'sender_ep_nb', 'sender_ep_username', 'trx_id', 'trx_time')
def _(user: Admin, id, sender_ep_nb: str, sender_ep_username: str, trx_id: str, trx_time: str) -> None:
    request_response = {
        'withdrawal_not_found':      False,
        'already_responded':         False,
        'withdrawal_current_status': DoctorWithdrawalTransaction.StatusType.REQUESTED,
        'withdrawal_completed':      False,
    }

    a = DoctorWithdrawalTransaction()
    a.m_id = id

    if not a.load(select_cols=['m_status']):
        request_response['withdrawal_not_found'] = True

    elif a.m_status != DoctorWithdrawalTransaction.StatusType.REQUESTED:
        request_response['already_responded'] = True
        request_response['withdrawal_current_status'] = a.m_status

    else:
        a.m_sender_ep_nb = sender_ep_nb
        a.m_sender_ep_username = sender_ep_username
        a.m_trx_id = trx_id
        a.m_trx_time = trx_time
        a.m_status = DoctorWithdrawalTransaction.StatusType.COMPLETED

        a.update()
        a.commit()

        request_response['withdrawal_completed'] = True
        request_response['withdrawal_current_status'] = a.m_status

    return App.Res.ok(**request_response)


@App.api_route('/a/d/withdrawal/reject', 'PUT', access_control=[Admin.Login])
@App.json_inputs('id', 'reason')
def _(user: Admin, id, reason: str) -> None:
    request_response = {
        'withdrawal_not_found':      False,
        'already_responded':         False,
        'withdrawal_current_status': DoctorWithdrawalTransaction.StatusType.REQUESTED,
        'withdrawal_rejected':       False,
    }

    a = DoctorWithdrawalTransaction()
    a.m_id = id

    if not a.load(select_cols=['m_status']):
        request_response['withdrawal_not_found'] = True

    elif a.m_status != DoctorWithdrawalTransaction.StatusType.REQUESTED:
        request_response['already_responded'] = True
        request_response['withdrawal_current_status'] = a.m_status

    else:
        a.m_rejection_reason = reason
        a.m_status = DoctorWithdrawalTransaction.StatusType.REJECTED

        a.update()
        a.commit()

        request_response['withdrawal_rejected'] = True
        request_response['withdrawal_current_status'] = a.m_status

    return App.Res.ok(**request_response)
