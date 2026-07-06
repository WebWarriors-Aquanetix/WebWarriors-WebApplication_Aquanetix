import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const qualityAnalysisPath = import.meta.env.VITE_QUALITY_ANALYSIS_ENDPOINT_PATH ?? '/quality-analysis';

export class QualityAnalysisApi extends BaseApi {
    #qualityAnalysisEndpoint;

    constructor() {
        super();
        this.#qualityAnalysisEndpoint = new BaseEndpoint(this, qualityAnalysisPath);
    }

    getQualityAnalyses() {
        return this.#qualityAnalysisEndpoint.getAll();
    }

    getQualityAnalysisById(id) {
        return this.#qualityAnalysisEndpoint.getById(id);
    }

    createQualityAnalysis(resource) {
        return this.#qualityAnalysisEndpoint.create(resource);
    }

    evaluateQualityAnalysis(id) {
        return this.http.put(`${qualityAnalysisPath}/${id}/evaluate`);
    }

    confirmQualityAnalysis(id) {
        return this.http.put(`${qualityAnalysisPath}/${id}/confirm`);
    }

    dismissQualityAnalysis(id) {
        return this.http.put(`${qualityAnalysisPath}/${id}/dismiss`);
    }
}
