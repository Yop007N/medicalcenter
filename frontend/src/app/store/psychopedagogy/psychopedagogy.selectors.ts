import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PsychopedagogyState } from './psychopedagogy.reducer';

export const selectPsychopedagogyState = createFeatureSelector<PsychopedagogyState>('psychopedagogy');

export const selectPsychopedagogicalEvaluations = createSelector(
  selectPsychopedagogyState,
  state => state.evaluations
);

export const selectSelectedPsychopedagogicalEvaluation = createSelector(
  selectPsychopedagogyState,
  state => state.selectedEvaluation
);

export const selectInterventionSessions = createSelector(
  selectPsychopedagogyState,
  state => state.sessions
);

export const selectSelectedInterventionSession = createSelector(
  selectPsychopedagogyState,
  state => state.selectedSession
);

export const selectPsychopedagogyLoading = createSelector(
  selectPsychopedagogyState,
  state => state.loading
);

export const selectPsychopedagogyError = createSelector(
  selectPsychopedagogyState,
  state => state.error
);

// Get active evaluations
export const selectActivePsychopedagogicalEvaluations = createSelector(
  selectPsychopedagogicalEvaluations,
  evaluations => evaluations.filter(e => e.status === 'active')
);

// Get sessions by evaluation
export const selectInterventionSessionsByEvaluation = (evaluationId: number) => createSelector(
  selectInterventionSessions,
  sessions => sessions.filter(s => s.evaluation_id === evaluationId)
);

// Get latest session
export const selectLatestInterventionSession = createSelector(
  selectInterventionSessions,
  sessions => {
    if (sessions.length === 0) return null;
    return sessions.reduce((latest, session) =>
      new Date(session.session_date) > new Date(latest.session_date) ? session : latest
    );
  }
);

// Get sessions count
export const selectInterventionSessionsCount = createSelector(
  selectInterventionSessions,
  sessions => sessions.length
);

// Get evaluations by learning difficulty
export const selectEvaluationsByDifficulty = (difficulty: string) => createSelector(
  selectPsychopedagogicalEvaluations,
  evaluations => evaluations.filter(e => e.learning_difficulties?.includes(difficulty))
);
