from utils import App


@App.api_route('/test', method='GET', access_control='All', prefix_api=False)
def _(user: None) -> None:
    return App.Res.ok(data='good')


@App.api_route('/test', method='GET', access_control='All')
def _(user: None) -> None:
    return App.Res.ok(data='good')


@App.api_route('/test', method='PUT', access_control='All')
def _(user: None) -> None:
    return App.Res.ok(data='good')
