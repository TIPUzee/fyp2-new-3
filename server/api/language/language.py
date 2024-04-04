from utils import App
from src import Language


@App.api_route('/languages', method='GET', access_control='All')
def _(user: None):
    lan = Language()
    return App.Res.ok(languages=lan.select())
