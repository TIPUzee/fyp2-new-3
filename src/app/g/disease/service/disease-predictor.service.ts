import { Injectable } from '@angular/core';
import { HTTPService } from "../../../services/http.service";
import { PredictDiseaseResponse } from "../../../interfaces/api-response-interfaces";

@Injectable({
    providedIn: 'root'
})
export class DiseasePredictorService {
    res: PredictDiseaseResponse | false = false;
    
    
    constructor(
        private http: HTTPService,
    ) { }
    
    
    async predictDisease(symptoms: string[]): Promise<PredictDiseaseResponse | false> {
        this.res = await this.http.sendRequest({
            url: '/ml_models/disease_predictor/predict',
            method: 'POST',
            jsonData: { symptoms },
        }) as PredictDiseaseResponse | false;
        return this.res;
    }
}
