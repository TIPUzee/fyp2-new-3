from flask import request

from utils import App, UploadedFile


@App.api_route('/test', method='PUT', access_control='All')
def _(user: None) -> None:
    print(request.headers)
    print([request.form.get(i) for i in request.form])
    print([i for i in request.files])
    # save all files to /uploads
    [UploadedFile(i).save() for i in request.files.values() if i.filename]
    return App.Res.ok(updated='complete')
