import { createAction, props } from '@ngrx/store';
import { PsychologicalEvaluation, TherapySession, PsychologicalEvaluationCreate, TherapySessionCreate } from '../../models/psychology.model';

// Load Evaluations
export const loadEvaluations = createAction(
  '[Psychology] Load Evaluations',
  props<{ patientId?: number }>()
);
export const loadEvaluationsSuccess = createAction(
  '[Psychology] Load Evaluations Success',
  props<{ evaluations: PsychologicalEvaluation[] }>()
);
export const loadEvaluationsFailure = createAction(
  '[Psychology] Load Evaluations Failure',
  props<{ error: string }>()
);

// Load Single Evaluation
export const loadEvaluation = createAction(
  '[Psychology] Load Evaluation',
  props<{ id: number }>()
);
export const loadEvaluationSuccess = createAction(
  '[Psychology] Load Evaluation Success',
  props<{ evaluation: PsychologicalEvaluation }>()
);
export const loadEvaluationFailure = createAction(
  '[Psychology] Load Evaluation Failure',
  props<{ error: string }>()
);

// Create Evaluation
export const createEvaluation = createAction(
  '[Psychology] Create Evaluation',
  props<{ evaluation: PsychologicalEvaluationCreate }>()
);
export const createEvaluationSuccess = createAction(
  '[Psychology] Create Evaluation Success',
  props<{ evaluation: PsychologicalEvaluation }>()
);
export const createEvaluationFailure = createAction(
  '[Psychology] Create Evaluation Failure',
  props<{ error: string }>()
);

// Update Evaluation
export const updateEvaluation = createAction(
  '[Psychology] Update Evaluation',
  props<{ id: number; evaluation: Partial<PsychologicalEvaluation> }>()
);
export const updateEvaluationSuccess = createAction(
  '[Psychology] Update Evaluation Success',
  props<{ evaluation: PsychologicalEvaluation }>()
);
export const updateEvaluationFailure = createAction(
  '[Psychology] Update Evaluation Failure',
  props<{ error: string }>()
);

// Delete Evaluation
export const deleteEvaluation = createAction(
  '[Psychology] Delete Evaluation',
  props<{ id: number }>()
);
export const deleteEvaluationSuccess = createAction(
  '[Psychology] Delete Evaluation Success',
  props<{ id: number }>()
);
export const deleteEvaluationFailure = createAction(
  '[Psychology] Delete Evaluation Failure',
  props<{ error: string }>()
);

// Load Therapy Sessions
export const loadSessions = createAction(
  '[Psychology] Load Sessions',
  props<{ evaluationId: number }>()
);
export const loadSessionsSuccess = createAction(
  '[Psychology] Load Sessions Success',
  props<{ sessions: TherapySession[] }>()
);
export const loadSessionsFailure = createAction(
  '[Psychology] Load Sessions Failure',
  props<{ error: string }>()
);

// Load Single Session
export const loadSession = createAction(
  '[Psychology] Load Session',
  props<{ id: number }>()
);
export const loadSessionSuccess = createAction(
  '[Psychology] Load Session Success',
  props<{ session: TherapySession }>()
);
export const loadSessionFailure = createAction(
  '[Psychology] Load Session Failure',
  props<{ error: string }>()
);

// Create Session
export const createSession = createAction(
  '[Psychology] Create Session',
  props<{ session: TherapySessionCreate }>()
);
export const createSessionSuccess = createAction(
  '[Psychology] Create Session Success',
  props<{ session: TherapySession }>()
);
export const createSessionFailure = createAction(
  '[Psychology] Create Session Failure',
  props<{ error: string }>()
);

// Update Session
export const updateSession = createAction(
  '[Psychology] Update Session',
  props<{ id: number; session: Partial<TherapySession> }>()
);
export const updateSessionSuccess = createAction(
  '[Psychology] Update Session Success',
  props<{ session: TherapySession }>()
);
export const updateSessionFailure = createAction(
  '[Psychology] Update Session Failure',
  props<{ error: string }>()
);

// Delete Session
export const deleteSession = createAction(
  '[Psychology] Delete Session',
  props<{ id: number }>()
);
export const deleteSessionSuccess = createAction(
  '[Psychology] Delete Session Success',
  props<{ id: number }>()
);
export const deleteSessionFailure = createAction(
  '[Psychology] Delete Session Failure',
  props<{ error: string }>()
);

// Clear
export const clearPsychologyState = createAction('[Psychology] Clear State');
export const clearError = createAction('[Psychology] Clear Error');
