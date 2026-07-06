import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { QualityAnalysisApi } from '../infrastructure/quality-analysis-api.js';

const qualityAnalysisApi = new QualityAnalysisApi();

const useDashboardStore = defineStore('dashboard', () => {
    const qualityAnalyses = ref([]);
    const qualityAnalysesLoaded = ref(false);
    const errors = ref([]);

    const totalAnalyses = computed(() => qualityAnalyses.value.length);

    const averageSeverity = computed(() => {
        if (!qualityAnalyses.value.length) return 0;
        const total = qualityAnalyses.value.reduce(
            (sum, analysis) => sum + Number(analysis.severityScore ?? 0),
            0
        );
        return total / qualityAnalyses.value.length;
    });

    const contaminationPredictions = computed(() =>
        qualityAnalyses.value.filter(analysis => analysis.hasContaminationPeakPrediction).length
    );

    const recentAnalyses = computed(() =>
        [...qualityAnalyses.value]
            .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
            .slice(0, 5)
    );

    function fetchQualityAnalyses() {
        errors.value = [];

        return qualityAnalysisApi.getQualityAnalyses()
            .then(response => {
                qualityAnalyses.value = Array.isArray(response.data) ? response.data : [];
                qualityAnalysesLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function createQualityAnalysis(resource) {
        errors.value = [];

        return qualityAnalysisApi.createQualityAnalysis(resource)
            .then(response => {
                qualityAnalyses.value = [response.data, ...qualityAnalyses.value];
                qualityAnalysesLoaded.value = true;
                return response.data;
            })
            .catch(error => {
                errors.value.push(error);
                throw error;
            });
    }

    function replaceQualityAnalysis(updatedAnalysis) {
        const index = qualityAnalyses.value.findIndex(analysis => String(analysis.id) === String(updatedAnalysis.id));
        if (index === -1) {
            qualityAnalyses.value = [updatedAnalysis, ...qualityAnalyses.value];
            return;
        }
        qualityAnalyses.value = qualityAnalyses.value.map(analysis =>
            String(analysis.id) === String(updatedAnalysis.id) ? updatedAnalysis : analysis
        );
    }

    function updateQualityAnalysisStatusLocally(id, anomalyStatus) {
        qualityAnalyses.value = qualityAnalyses.value.map(analysis =>
            String(analysis.id) === String(id) ? { ...analysis, anomalyStatus } : analysis
        );
    }

    function evaluateQualityAnalysis(id) {
        errors.value = [];
        updateQualityAnalysisStatusLocally(id, 'Evaluated');

        return qualityAnalysisApi.evaluateQualityAnalysis(id)
            .then(response => {
                replaceQualityAnalysis(response.data);
                fetchQualityAnalyses();
                return response.data;
            })
            .catch(error => {
                errors.value.push(error);
                fetchQualityAnalyses();
                throw error;
            });
    }

    function confirmQualityAnalysis(id) {
        errors.value = [];
        updateQualityAnalysisStatusLocally(id, 'Confirmed');

        return qualityAnalysisApi.confirmQualityAnalysis(id)
            .then(response => {
                replaceQualityAnalysis(response.data);
                fetchQualityAnalyses();
                return response.data;
            })
            .catch(error => {
                errors.value.push(error);
                fetchQualityAnalyses();
                throw error;
            });
    }

    function dismissQualityAnalysis(id) {
        errors.value = [];
        updateQualityAnalysisStatusLocally(id, 'Dismissed');

        return qualityAnalysisApi.dismissQualityAnalysis(id)
            .then(response => {
                replaceQualityAnalysis(response.data);
                fetchQualityAnalyses();
                return response.data;
            })
            .catch(error => {
                errors.value.push(error);
                fetchQualityAnalyses();
                throw error;
            });
    }

    return {
        qualityAnalyses,
        qualityAnalysesLoaded,
        errors,
        totalAnalyses,
        averageSeverity,
        contaminationPredictions,
        recentAnalyses,
        fetchQualityAnalyses,
        createQualityAnalysis,
        evaluateQualityAnalysis,
        confirmQualityAnalysis,
        dismissQualityAnalysis
    };
});

export default useDashboardStore;
