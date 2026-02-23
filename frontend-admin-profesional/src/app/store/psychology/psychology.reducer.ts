import { createReducer, on } from '@ngrx/store';
import { PsychologicalEvaluation, TherapySession } from '../../models/psychology.model';
import * as PsychologyActions from './psychology.actions';

export interface PsychologyState {
  evaluations: PsychologicalEvaluation[];
  selectedEvaluation: PsychologicalEvaluation | null;
  sessions: TherapySession[];
  selectedSession: TherapySession | null;
  loading: boolean;
  error: string | null;
}

export const initialState: PsychologyState = {
  evaluations: [],
  selectedEvaluation: null,
  sessions: [],
  selectedSession: null,
  loading: false,
  error: null
};

export const psychologyReducer = createReducer(
  initialState,

  // Load Evaluations
  on(PsychologyActions.loadEvaluations, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.loadEvaluationsSuccess, (state, { evaluations }) => ({
    ...state,
    evaluations,
    loading: false
  })),
  on(PsychologyActions.loadEvaluationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Evaluation
  on(PsychologyActions.loadEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.loadEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychologyActions.loadEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Evaluation
  on(PsychologyActions.createEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.createEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    evaluations: [...state.evaluations, evaluation],
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychologyActions.createEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Evaluation
  on(PsychologyActions.updateEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.updateEvaluationSuccess, (state, { evaluation }) => ({
    ...state,
    evaluations: state.evaluations.map(e => e.id === evaluation.id ? evaluation : e),
    selectedEvaluation: evaluation,
    loading: false
  })),
  on(PsychologyActions.updateEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Evaluation
  on(PsychologyActions.deleteEvaluation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.deleteEvaluationSuccess, (state, { id }) => ({
    ...state,
    evaluations: state.evaluations.filter(e => e.id !== id),
    selectedEvaluation: state.selectedEvaluation?.id === id ? null : state.selectedEvaluation,
    loading: false
  })),
  on(PsychologyActions.deleteEvaluationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Sessions
  on(PsychologyActions.loadSessions, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.loadSessionsSuccess, (state, { sessions }) => ({
    ...state,
    sessions,
    loading: false
  })),
  on(PsychologyActions.loadSessionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Session
  on(PsychologyActions.loadSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.loadSessionSuccess, (state, { session }) => ({
    ...state,
    selectedSession: session,
    loading: false
  })),
  on(PsychologyActions.loadSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Session
  on(PsychologyActions.createSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.createSessionSuccess, (state, { session }) => ({
    ...state,
    sessions: [...state.sessions, session],
    selectedSession: session,
    loading: false
  })),
  on(PsychologyActions.createSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Session
  on(PsychologyActions.updateSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.updateSessionSuccess, (state, { session }) => ({
    ...state,
    sessions: state.sessions.map(s => s.id === session.id ? session : s),
    selectedSession: session,
    loading: false
  })),
  on(PsychologyActions.updateSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Session
  on(PsychologyActions.deleteSession, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PsychologyActions.deleteSessionSuccess, (state, { id }) => ({
    ...state,
    sessions: state.sessions.filter(s => s.id !== id),
    selectedSession: state.selectedSession?.id === id ? null : state.selectedSession,
    loading: false
  })),
  on(PsychologyActions.deleteSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(PsychologyActions.clearPsychologyState, () => initialState),
  on(PsychologyActions.clearError, state => ({
    ...state,
    error: null
  }))
);
