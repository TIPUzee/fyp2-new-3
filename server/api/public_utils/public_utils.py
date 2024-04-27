from flask import send_file

from utils import App, SavedFile


@App.api_route('/file/<path:file_path>', method='GET', access_control='All')
def _(user: None, file_path):
    if file_path.endswith('pdf'):
        return SavedFile(file_path).return_file(as_attachment=False)
    return SavedFile(file_path).return_file(as_attachment=False)


@App.api_route('/video/<path:file_path>', method='GET', access_control='All')
def _(user: None, file_path: str):
    return SavedFile(file_path).return_file(as_attachment=False, mimetype='application/octet-stream')
