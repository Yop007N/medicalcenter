import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PsychologyState } from './psychology.reducer';

export const selectPsychologyState = createFeatureSelector<PsychologyState>('psychology');

export const selectPsychologicalEvaluations = createSelector(
  selectPsychologyState,
  state => state.evaluations
);

export const selectSelectedEvaluation = createSelector(
  selectPsychologyState,
  state => state.selectedEvaluation
);

export const selectTherapySessions = createSelector(
  selectPsychologyState,
  state => state.sessions
);

export const selectSelectedSession = createSelector(
  selectPsychologyState,
  state => state.selectedSession
);

export const selectPsychologyLoading = createSelector(
  selectPsychologyState,
  state => state.loading
);

export const selectPsychologyError = createSelector(
  selectPsychologyState,
  state => state.error
);

// Get active evaluations
export const selectActiveEvaluations = createSelector(
  selectPsychologicalEvaluations,
  evaluations => evaluations.filter(e => e.status === 'active')
);

// Get sessions by evaluation
export const selectSessionsByEvaluation = (evaluationId: number) => createSelector(
  selectTherapySessions,
  sessions => sessions.filter(s => s.evaluation_id === evaluationId)
);

// Get latest session
export const selectLatestSession = createSelector(
  selectTherapySessions,
  sessions => {
    if (sessions.length === 0) return null;
    return sessions.reduce((latest, session) =>
      new Date(session.session_date) > new Date(latest.session_date) ? session : latest
    );
  }
);

// Get sessions count
export const selectSessionsCount = createSelector(
  selectTherapySessions,
  sessions => sessions.length
);
