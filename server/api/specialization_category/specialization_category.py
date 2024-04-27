from utils import App, Func, Validator as Vld
from src import SpecializationCategory, Admin


@App.api_route('/specialization-categories', method='GET', access_control='All')
def _(user: None):
    s = SpecializationCategory()
    return App.Res.ok(specialization_categories=s.select())


@App.api_route('/a/specialization-categories', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_specialization_categories(user)


@App.api_route(
    '/a/specialization-category/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_specialization_categories(user, id)


def get_specialization_categories(user: Admin, id: int = None):
    request_response = {
        'specialization_categories': []
    }
    s = SpecializationCategory()
    if id:
        s.m_id = id
    request_response['specialization_categories'] = s.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route('/a/specialization-category', method='POST', access_control=[Admin.Login])
@App.json_inputs('title')
def _(user: Admin, title: str):
    request_response = {
        'title_already_exists': False,
        'exists_as_id': 0,
        'specialization_category_created': False,
    }

    s = SpecializationCategory()
    s.m_title = title
    if s.load():
        request_response['title_already_exists'] = True
        request_response['exists_as_id'] = s.m_id

    else:
        s.reset()
        s.m_title = title
        s.m_creation_time = Func.get_current_time()
        s.insert(load_inserted_id_to='m_id')
        s.commit()
        request_response['specialization_category_created'] = True
        request_response['exists_as_id'] = s.m_id

    return App.Res.ok(**request_response)


@App.api_route(
    '/a/specialization-category/<id>', path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()}, method='PUT', access_control=[Admin.Login]
)
@App.json_inputs('title')
def _(user: Admin, id: int, title: str):
    request_response = {
        'specialization_category_does_not_exist': False,
        'title_already_exists': False,
        'updated': False,
    }

    s = SpecializationCategory()
    s.m_id = id
    s.m_title = title

    if not s.exists(where_equals=['m_id']):
        request_response['specialization_category_does_not_exist'] = True

    elif s.exists(where_equals=['m_title']):
        request_response['title_already_exists'] = True

    else:
        s.update()
        s.commit()
        request_response['updated'] = True

    return App.Res.ok(**request_response)


@App.api_route(
    '/a/specialization-category/<id>', path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()}, method='DELETE', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    request_response = {
        'specialization_category_does_not_exist': False,
        'specialization_category_deleted': False,
    }

    s = SpecializationCategory()
    s.m_id = id

    if not s.exists():
        request_response['specialization_category_does_not_exist'] = True

    else:
        s.delete()
        s.commit()
        request_response['specialization_category_deleted'] = True

    return App.Res.ok(**request_response)
