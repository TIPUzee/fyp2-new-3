from datetime import datetime, timezone

from utils import App, Validator as Vld, UploadedFiles

from src import PatientRefundTransaction, Patient, Admin


@App.api_route('/withdraw/refund-request', method='POST', access_control=[Patient.Login])
@App.json_inputs(
    'receiver_ep_nb', 'receiver_ep_username',
)
def _(user: Patient, receiver_ep_nb: str, receiver_ep_username: str) -> None:
    request_response = {
        'min_amount':         100,
        'min_amount_not_met': False,
        'already_requested':  False,
        'success':            False,
    }

    if user.m_refundable_amount < request_response['min_amount']:
        request_response['min_amount_not_met'] = True
        return App.Res.client_error(**request_response)

    rt = PatientRefundTransaction()
    rt.m_patient_id = user.m_id
    rt.m_status = PatientRefundTransaction.StatusType.REQUESTED

    if rt.exists():
        request_response['already_requested'] = True
        return App.Res.client_error(**request_response)

    rt.m_amount = user.m_refundable_amount
    rt.m_receiver_ep_nb = receiver_ep_nb
    rt.m_receiver_ep_username = receiver_ep_username
    rt.m_request_time = datetime.now(timezone.utc)

    rt.insert()
    rt.commit()

    request_response['success'] = True
    return App.Res.ok(**request_response)


@App.api_route('/withdraw/prev-refund-request', method='GET', access_control=[Patient.Login])
def _(user: Patient) -> None:
    request_response = {
        'never_requested':   False,
        'already_requested': False,
        'prev_rejected':     False,
        'prev_completed':    False,
        'request_details':   False,
    }

    rt = PatientRefundTransaction()
    rt.m_patient_id = user.m_id

    if not rt.load(_order_by='m_request_time', _desc=True):
        request_response['never_requested'] = True
        return App.Res.ok(**request_response)

    elif rt.m_status == PatientRefundTransaction.StatusType.REQUESTED:
        request_response['already_requested'] = True

    elif rt.m_status == PatientRefundTransaction.StatusType.REJECTED:
        request_response['prev_rejected'] = True

    elif rt.m_status == PatientRefundTransaction.StatusType.COMPLETED:
        request_response['prev_completed'] = True

    request_response['request_details'] = rt.to_dict()
    return App.Res.ok(**request_response)


@App.api_route('/withdraw/refund-transactions', method='GET', access_control=[Patient.Login])
def _(user: Patient) -> None:
    request_response = {
        'no_transactions':     False,
        'refund_transactions': [],
    }

    rt = PatientRefundTransaction()
    rt.m_patient_id = user.m_id
    rt.m_status = rt.StatusType.COMPLETED
    rt_list = rt.select()

    if not rt_list:
        request_response['no_transactions'] = True

    request_response['refund_transactions'] = rt_list
    return App.Res.ok(**request_response)
