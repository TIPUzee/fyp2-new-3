from utils import App, Validator as Vld
from src import DiseasePredictorMLModel, Admin


@App.api_route('/ml_models/disease_predictor/predict', method='POST', access_control='All')
@App.json_inputs('symptoms')
def _(user: None, symptoms: list[str]):
    request_response = {
        'disease': None
    }

    symptoms_validator = Vld.List(Vld.Str())

    if not symptoms_validator(symptoms):
        return App.Res.frontend_error(
            Vld.format_type_error(
                'symptoms', symptoms, symptoms_validator
            )
        )

    model = DiseasePredictorMLModel()
    model.load_model()
    df = model.make_features_dataframe(symptoms)

    if isinstance(df, bool) and not df:
        return App.Res.frontend_error('Some symptoms are not in the dataset')

    disease = model.predict_disease(df)

    if not disease:
        return App.Res.frontend_error('Model is not trained yet')

    request_response['disease'] = disease
    return App.Res.ok(**request_response)


@App.api_route('/ml_models/disease_predictor/train', method='GET', access_control=[Admin.Login])
def _(user: None):
    request_response = {
        'model_trained': False
    }

    model = DiseasePredictorMLModel()
    model.load_data()
    model.clean_data()
    model.train_and_save_model()

    request_response['model_trained'] = True
    return App.Res.ok(**request_response)
