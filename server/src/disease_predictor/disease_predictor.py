from __future__ import annotations

from typing import Optional, Callable, TypeVar

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import numpy as np
import joblib

import time

R = TypeVar('R')


def wait_until_training_is_done(func: Callable[..., R]) -> Callable[..., R]:
    def _(*args, **kwargs):
        while DiseasePredictorMLModel.is_training:
            time.sleep(1)
        return func(*args, **kwargs)

    return _


class DiseasePredictorMLModel:
    is_training = False
    model: Optional[RandomForestClassifier] = None

    def __init__(self):
        self.training_ds = pd.read_csv('./dataset/disease_predictor/Training.csv')
        self.testing_ds = pd.read_csv('./dataset/disease_predictor/Testing.csv')
        self.training_ds: pd.DataFrame
        self.testing_ds: pd.DataFrame
        self.y = self.training_ds['prognosis']
        self.X = self.training_ds.drop('prognosis', axis=1)
        self.classifier = RandomForestClassifier(random_state=42, n_estimators=7)
        self.saved_model_filename = 'trained_models/disease_predictor.pkl'

    def load_data(self):
        return self.training_ds, self.testing_ds

    def clean_data(self):
        self.training_ds.dropna(inplace=True)
        self.training_ds.isna().sum()
        self.testing_ds.isna().sum()

    @wait_until_training_is_done
    def train_and_save_model(self) -> RandomForestClassifier:
        self.is_training = True
        DiseasePredictorMLModel.model = self.classifier.fit(self.X, self.y)
        joblib.dump(self.model, self.saved_model_filename)
        self.is_training = False
        return self.model  # type: ignore

    @wait_until_training_is_done
    def save_model(self) -> None:
        joblib.dump(self.model, self.saved_model_filename)

    @wait_until_training_is_done
    def load_model(self) -> RandomForestClassifier:
        while self.is_training:
            time.sleep(3)
        DiseasePredictorMLModel.model = joblib.load(self.saved_model_filename)
        return self.model

    @wait_until_training_is_done
    def get_symptoms_ordered_by_importance(self) -> list[str]:
        if not self.model:
            raise ValueError("Model is not trained yet")

        feature_importance = self.model.feature_importances_
        feature_importance = 100.0 * (feature_importance / feature_importance.max())
        sorted_idx = np.argsort(feature_importance)
        sorted_feature_importance = feature_importance[sorted_idx]
        sorted_feature_names = self.X.columns[sorted_idx]
        return sorted_feature_names

    @wait_until_training_is_done
    def make_features_dataframe(self, symptoms: list[str]) -> pd.DataFrame | False:
        _symptoms = {}
        for f in self.X.columns:
            if f not in symptoms:
                _symptoms[f] = 0
            else:
                _symptoms[f] = 1
        return pd.DataFrame([_symptoms])

    @wait_until_training_is_done
    def predict_disease(self, symptoms: pd.DataFrame) -> str | False:
        if not self.model:
            raise ValueError("Model is not trained yet")
        return self.model.predict(symptoms)[0]

    @wait_until_training_is_done
    def get_accuracy(self) -> float:
        if not self.model:
            raise ValueError("Model is not trained yet")
        X_train, X_test, y_train, y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        return accuracy_score(y_test, self.model.predict(X_test))

    @wait_until_training_is_done
    def get_accuracy_on_testing_data(self) -> float:
        if not self.model:
            raise ValueError("Model is not trained yet")
        return accuracy_score(
            self.testing_ds['prognosis'],
            self.model.predict(self.testing_ds.drop('prognosis', axis=1))
        )
