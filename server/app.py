from utils import App

App.init_app('AI-Disease Predictor')
App.enable_cors()

from api import _ # noqa

if __name__ == '__main__':
    print('Starting app - AI-Disease Predictor - __main__')
    App.run_app(debug=True, host='0.0.0.0', port=80)
