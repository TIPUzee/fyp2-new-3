from datetime import datetime, timezone

from utils import App, Validator as Vld

from src import DoctorWithdrawalTransaction, Doctor, Admin


@App.api_route('/withdraw/withdrawal-transactions', method='GET', access_control=[Doctor.Login])
def _(user: Doctor) -> None:
    request_response = {
        'no_transactions':         False,
        'withdrawal_transactions': [],
    }

    rt = DoctorWithdrawalTransaction()
    rt.m_doctor_id = user.m_id
    rt.m_status = rt.StatusType.COMPLETED
    rt_list = rt.select()

    if not rt_list:
        request_response['no_transactions'] = True

    request_response['withdrawal_transactions'] = rt_list
    return App.Res.ok(**request_response)
