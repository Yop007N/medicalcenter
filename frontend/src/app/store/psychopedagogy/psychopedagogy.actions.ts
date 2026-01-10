import { createAction, props } from '@ngrx/store';
import { PsychopedagogicalEvaluation, InterventionSession, PsychopedagogicalEvaluationCreate, InterventionSessionCreate } from '../../models/psychopedagogy.model';

// Load Evaluations
export const loadEvaluations = createAction(
  '[Psychopedagogy] Load Evaluations',
  props<{ patientId?: number }>()
);
export const loadEvaluationsSuccess = createAction(
  '[Psychopedagogy] Load Evaluations Success',
  props<{ evaluations: PsychopedagogicalEvaluation[] }>()
);
export const loadEvaluationsFailure = createAction(
  '[Psychopedagogy] Load Evaluations Failure',
  props<{ error: string }>()
);

// Load Single Evaluation
export const loadEvaluation = createAction(
  '[Psychopedagogy] Load Evaluation',
  props<{ id: number }>()
);
export const loadEvaluationSuccess = createAction(
  '[Psychopedagogy] Load Evaluation Success',
  props<{ evaluation: PsychopedagogicalEvaluation }>()
);
export const loadEvaluationFailure = createAction(
  '[Psychopedagogy] Load Evaluation Failure',
  props<{ error: string }>()
);

// Create Evaluation
export const createEvaluation = createAction(
  '[Psychopedagogy] Create Evaluation',
  props<{ evaluation: PsychopedagogicalEvaluationCreate }>()
);
export const createEvaluationSuccess = createAction(
  '[Psychopedagogy] Create Evaluation Success',
  props<{ evaluation: PsychopedagogicalEvaluation }>()
);
export const createEvaluationFailure = createAction(
  '[Psychopedagogy] Create Evaluation Failure',
  props<{ error: string }>()
);

// Update Evaluation
export const updateEvaluation = createAction(
  '[Psychopedagogy] Update Evaluation',
  props<{ id: number; evaluation: Partial<PsychopedagogicalEvaluation> }>()
);
export const updateEvaluationSuccess = createAction(
  '[Psychopedagogy] Update Evaluation Success',
  props<{ evaluation: PsychopedagogicalEvaluation }>()
);
export const updateEvaluationFailure = createAction(
  '[Psychopedagogy] Update Evaluation Failure',
  props<{ error: string }>()
);

// Delete Evaluation
export const deleteEvaluation = createAction(
  '[Psychopedagogy] Delete Evaluation',
  props<{ id: number }>()
);
export const deleteEvaluationSuccess = createAction(
  '[Psychopedagogy] Delete Evaluation Success',
  props<{ id: number }>()
);
export const deleteEvaluationFailure = createAction(
  '[Psychopedagogy] Delete Evaluation Failure',
  props<{ error: string }>()
);

// Load Intervention Sessions
export const loadSessions = createAction(
  '[Psychopedagogy] Load Sessions',
  props<{ evaluationId: number }>()
);
export const loadSessionsSuccess = createAction(
  '[Psychopedagogy] Load Sessions Success',
  props<{ sessions: InterventionSession[] }>()
);
export const loadSessionsFailure = createAction(
  '[Psychopedagogy] Load Sessions Failure',
  props<{ error: string }>()
);

// Load Single Session
export const loadSession = createAction(
  '[Psychopedagogy] Load Session',
  props<{ id: number }>()
);
export const loadSessionSuccess = createAction(
  '[Psychopedagogy] Load Session Success',
  props<{ session: InterventionSession }>()
);
export const loadSessionFailure = createAction(
  '[Psychopedagogy] Load Session Failure',
  props<{ error: string }>()
);

// Create Session
export const createSession = createAction(
  '[Psychopedagogy] Create Session',
  props<{ session: InterventionSessionCreate }>()
);
export const createSessionSuccess = createAction(
  '[Psychopedagogy] Create Session Success',
  props<{ session: InterventionSession }>()
);
export const createSessionFailure = createAction(
  '[Psychopedagogy] Create Session Failure',
  props<{ error: string }>()
);

// Update Session
export const updateSession = createAction(
  '[Psychopedagogy] Update Session',
  props<{ id: number; session: Partial<InterventionSession> }>()
);
export const updateSessionSuccess = createAction(
  '[Psychopedagogy] Update Session Success',
  props<{ session: InterventionSession }>()
);
export const updateSessionFailure = createAction(
  '[Psychopedagogy] Update Session Failure',
  props<{ error: string }>()
);

// Delete Session
export const deleteSession = createAction(
  '[Psychopedagogy] Delete Session',
  props<{ id: number }>()
);
export const deleteSessionSuccess = createAction(
  '[Psychopedagogy] Delete Session Success',
  props<{ id: number }>()
);
export const deleteSessionFailure = createAction(
  '[Psychopedagogy] Delete Session Failure',
  props<{ error: string }>()
);

// Clear
export const clearPsychopedagogyState = createAction('[Psychopedagogy] Clear State');
export const clearError = createAction('[Psychopedagogy] Clear Error');
