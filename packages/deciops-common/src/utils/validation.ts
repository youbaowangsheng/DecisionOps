import { DecisionCard } from '../types/decision';
import { ScenarioConfig } from '../types/scenario';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate a DecisionCard object
 *
 * @param card - The decision card to validate
 * @returns ValidationResult with valid flag and any errors found
 */
export function validateDecisionCard(card: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!card) {
    errors.push({
      field: 'card',
      message: 'Decision card is required',
      code: 'CARD_REQUIRED',
    });
    return { valid: false, errors };
  }

  // Required fields
  if (!card.decision_id) {
    errors.push({
      field: 'decision_id',
      message: 'Decision ID is required',
      code: 'DECISION_ID_REQUIRED',
    });
  }

  if (!card.tenant_id) {
    errors.push({
      field: 'tenant_id',
      message: 'Tenant ID is required',
      code: 'TENANT_ID_REQUIRED',
    });
  }

  if (!card.scenario_id) {
    errors.push({
      field: 'scenario_id',
      message: 'Scenario ID is required',
      code: 'SCENARIO_ID_REQUIRED',
    });
  }

  // Status validation
  const validStatuses = ['pending_audit', 'approved', 'rejected', 'modified', 'expired'];
  if (card.status && !validStatuses.includes(card.status)) {
    errors.push({
      field: 'status',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      code: 'INVALID_STATUS',
    });
  }

  // Confidence validation
  if (card.confidence !== undefined) {
    if (typeof card.confidence !== 'number' || card.confidence < 0 || card.confidence > 1) {
      errors.push({
        field: 'confidence',
        message: 'Confidence must be a number between 0 and 1',
        code: 'INVALID_CONFIDENCE',
      });
    }
  }

  // Judgment validation
  if (card.judgment) {
    if (!card.judgment.title) {
      errors.push({
        field: 'judgment.title',
        message: 'Judgment title is required',
        code: 'JUDGMENT_TITLE_REQUIRED',
      });
    }
    if (!card.judgment.logic_summary) {
      errors.push({
        field: 'judgment.logic_summary',
        message: 'Judgment logic summary is required',
        code: 'JUDGMENT_LOGIC_SUMMARY_REQUIRED',
      });
    }
  }

  // Date field validation
  const dateFields = ['generated_at', 'created_at', 'updated_at'];
  for (const field of dateFields) {
    if (card[field] && !isValidDateString(card[field])) {
      errors.push({
        field,
        message: `${field} must be a valid ISO date string`,
        code: 'INVALID_DATE_FORMAT',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a ScenarioConfig object
 *
 * @param config - The scenario configuration to validate
 * @returns ValidationResult with valid flag and any errors found
 */
export function validateScenarioConfig(config: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!config) {
    errors.push({
      field: 'config',
      message: 'Scenario config is required',
      code: 'CONFIG_REQUIRED',
    });
    return { valid: false, errors };
  }

  // Required fields
  if (!config.scenario_id) {
    errors.push({
      field: 'scenario_id',
      message: 'Scenario ID is required',
      code: 'SCENARIO_ID_REQUIRED',
    });
  }

  if (!config.tenant_id) {
    errors.push({
      field: 'tenant_id',
      message: 'Tenant ID is required',
      code: 'TENANT_ID_REQUIRED',
    });
  }

  if (!config.name) {
    errors.push({
      field: 'name',
      message: 'Scenario name is required',
      code: 'NAME_REQUIRED',
    });
  }

  // Trigger config validation
  if (config.trigger_config) {
    const validTriggerTypes = ['scheduled', 'event', 'data_freshness'];
    if (config.trigger_config.type && !validTriggerTypes.includes(config.trigger_config.type)) {
      errors.push({
        field: 'trigger_config.type',
        message: `Invalid trigger type. Must be one of: ${validTriggerTypes.join(', ')}`,
        code: 'INVALID_TRIGGER_TYPE',
      });
    }
  }

  // Audit policy validation
  if (config.audit_policy) {
    if (typeof config.audit_policy.auto_approve_threshold !== 'number' ||
        config.audit_policy.auto_approve_threshold < 0 ||
        config.audit_policy.auto_approve_threshold > 1) {
      errors.push({
        field: 'audit_policy.auto_approve_threshold',
        message: 'auto_approve_threshold must be a number between 0 and 1',
        code: 'INVALID_THRESHOLD',
      });
    }

    if (typeof config.audit_policy.force_human_review !== 'boolean') {
      errors.push({
        field: 'audit_policy.force_human_review',
        message: 'force_human_review must be a boolean',
        code: 'INVALID_FORCE_HUMAN_REVIEW',
      });
    }

    if (typeof config.audit_policy.escalation_timeout_minutes !== 'number' ||
        config.audit_policy.escalation_timeout_minutes < 0) {
      errors.push({
        field: 'audit_policy.escalation_timeout_minutes',
        message: 'escalation_timeout_minutes must be a non-negative number',
        code: 'INVALID_TIMEOUT',
      });
    }
  }

  // Date fields validation
  const dateFields = ['created_at', 'updated_at'];
  for (const field of dateFields) {
    if (config[field] && !isValidDateString(config[field])) {
      errors.push({
        field,
        message: `${field} must be a valid ISO date string`,
        code: 'INVALID_DATE_FORMAT',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidDateString(dateStr: string): boolean {
  if (typeof dateStr !== 'string') {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
