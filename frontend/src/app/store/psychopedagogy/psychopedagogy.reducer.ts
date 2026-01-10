import { createReducer, on } from '@ngrx/store';
import { PsychopedagogicalEvaluation, InterventionSession } from '../../models/psychopedagogy.model';
import * as PsychopedagogyActions from './psychopedagogy.actions';

export interface PsychopedagogyState {
  evaluations: PsychopedagogicalEvaluation[];
  selectedEvaluation: PsychopedagogicalEvaluation | null;
  sessions: InterventionSession[];
  selectedSession: InterventionSession | null;
  loading: boolean;
  error: string | null;
}

export const initialState: PsychopedagogyState = {
  evaluations: [],
  selectedEvaluation: null,
  sessions: [],
  selectedSession: null,
  loading: false,
  error: null
};

export const psychopedagogyReducer = createReducer(
  initialState,

  // Load Evaluations
  on(PsychopedagogyActions.loadEvaluations, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.loadEvaluationsSuccess, (state, { evaluations }) => ({
    ...state,
    evaluations,
    loading: false
  })),
  on(PsychopedagogyActions.loadEvaluationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Evaluation
  on(PsychopedagogyActions.loadEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.loadEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychopedagogyActions.loadEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Evaluation
  on(PsychopedagogyActions.createEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.createEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    evaluations: [...state.evaluations, evaluation],
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychopedagogyActions.createEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Evaluation
  on(PsychopedagogyActions.updateEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.updateEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    evaluations: state.evaluations.map(e => e.id === evaluation.id ? evaluation : e),
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychopedagogyActions.updateEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Evaluation
  on(PsychopedagogyActions.deleteEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.deleteEvaluationSuccess, (state, { id }) => ({
    ...state,
    evaluations: state.evaluations.filter(e => e.id !== id),
    selectedEvaluation: state.selectedEvaluation?.id === id ? null : state.selectedEvaluation,
    loading: false
  })),
  on(PsychopedagogyActions.deleteEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Sessions
  on(PsychopedagogyActions.loadSessions, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.loadSessionsSuccess, (state, { sessions }) => ({
    ...state,
    sessions,
    loading: false
  })),
  on(PsychopedagogyActions.loadSessionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Session
  on(PsychopedagogyActions.loadSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.loadSessionSuccess, (state, { session }) => ({
    ...state,
    selectedSession: session,
    loading: false
  })),
  on(PsychopedagogyActions.loadSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Session
  on(PsychopedagogyActions.createSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.createSessionSuccess, (state, { session }) => ({
    ...state,
    sessions: [...state.sessions, session],
    selectedSession: session,
    loading: false
  })),
  on(PsychopedagogyActions.createSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Session
  on(PsychopedagogyActions.updateSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.updateSessionSuccess, (state, { session }) => ({
    ...state,
    sessions: state.sessions.map(s => s.id === session.id ? session : s),
    selectedSession: session,
    loading: false
  })),
  on(PsychopedagogyActions.updateSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Session
  on(PsychopedagogyActions.deleteSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychopedagogyActions.deleteSessionSuccess, (state, { id }) => ({
    ...state,
    sessions: state.sessions.filter(s => s.id !== id),
    selectedSession: state.selectedSession?.id === id ? null : state.selectedSession,
    loading: false
  })),
  on(PsychopedagogyActions.deleteSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(PsychopedagogyActions.clearPsychopedagogyState, () => initialState),
  on(PsychopedagogyActions.clearError, state => ({
    ...state,
    error: null
  }))
);
