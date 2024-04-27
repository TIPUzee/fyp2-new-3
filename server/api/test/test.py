from utils import App, SQL, Env


@App.api_route('/test', method='GET', access_control='All', prefix_api=False)
def _(user: None) -> None:
    return App.Res.ok(data='good')


@App.api_route('/test', method='GET', access_control='All')
def _(user: None) -> None:
    return App.Res.ok(data='good')


@App.api_route('/test', method='PUT', access_control='All')
def _(user: None) -> None:
    return App.Res.ok(data='good')


@App.api_route('/test/db', method='GET', access_control='All')
def _(user: None) -> None:
    sql = SQL()
    return App.Res.ok(data='good', db=sql.db_name)


@App.api_route('/test/mode', method='GET', access_control='All')
def _(user: None) -> None:
    return App.Res.ok(mode=Env.get('PROD_MODE'))
