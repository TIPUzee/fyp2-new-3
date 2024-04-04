from utils import App, SQL, Validator as Vld
from src import AvailabilityDuration


@App.api_route('/availability-durations', method='POST', access_control='All')
@App.json_inputs('doctor_ids')
def _(user: None, doctor_ids: list[int]):
    request_response = {
        'durations': []
    }

    validator = Vld.List(Vld.Int())
    if not validator(doctor_ids):
        return App.Res.frontend_error(
            *Vld.format_type_error('doctor_ids', doctor_ids, validator)
        )

    a = AvailabilityDuration()

    sql = SQL()
    res = sql.execute(
        f"SELECT * FROM {a.db_table_name} "
        f"WHERE {a.key.m_doctor_id} IN (%s)",
        [doctor_ids]
    )
    request_response['durations'] = res
    return App.Res.ok(**request_response)
