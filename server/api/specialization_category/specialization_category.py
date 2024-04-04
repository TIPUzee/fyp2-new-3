from utils import App, Func
from src import SpecializationCategory


@App.api_route(
    '/specialization-categories',
    method='GET',
    access_control='All'
)
def _(user: None):
    s = SpecializationCategory()
    return App.Res.ok(categories=s.select())


@App.api_route(
    '/specialization-category/<id>',
    method='GET',
    path_params_pre_conversion={'id': int},
    access_control='All'
)
def _(user: None, id: int):
    request_response = {
        'specialization_category_found': True,
        'specialization_category': None
    }

    s = SpecializationCategory()
    s.turn_off_validation()
    s.m_id = id
    if not s.load():
        request_response['specialization_category_found'] = False
        return App.Res.client_error(**request_response)

    request_response['specialization_category'] = s.to_dict()
    return App.Res.ok(**request_response)
