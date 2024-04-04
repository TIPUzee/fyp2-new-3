from flask import send_file

from utils import App, SavedFile


@App.api_route('/file/<path:file_path>', method='GET', access_control='All')
def _(user: None, file_path):
    return SavedFile(file_path).return_file(as_attachment=True)
